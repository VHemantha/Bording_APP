from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from properties.models import Property

from ai_agent.throttles import AIRateThrottle

from .identifiers import parse_identifier
from .models import Favorite, PhoneCode
from .otp import TooSoon, check_code, send_code, use_code
from .password_reset import send_reset_email, user_for_token
from .sms import SmsError
from .serializers import FavoriteSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class PasswordResetThrottle(AIRateThrottle):
    scope = 'password_reset'


class PasswordResetRequestView(APIView):
    """POST {identifier, lang?}: emails a reset link if the account has an email address.
    Always the same 200 reply, so it can't be used to find out which accounts exist."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetThrottle]

    def post(self, request):
        identifier = str(request.data.get('identifier', '')).strip()
        if not identifier:
            return Response({'identifier': ['Enter your email address or phone number.']}, status=400)
        send_reset_email(request, identifier, lang=str(request.data.get('lang', 'en')))
        return Response({'detail': 'If the account has an email address, a reset link has been sent.'})


class PhoneCodeThrottle(AIRateThrottle):
    scope = 'otp'


def _phone(value):
    """+94... for a phone number in any common format, or None."""
    try:
        kind, phone = parse_identifier(str(value or ''))
    except DjangoValidationError:
        return None
    return phone if kind == 'phone' else None


WRONG_CODE = 'That code is wrong or has expired. Check the SMS or ask for a new code.'


class PhoneCodeView(APIView):
    """POST {phone, purpose: "register" | "reset"}: texts a 6-digit code to the number.

    register: refused if the number already has an account. reset: the same reply whether or
    not it has one (so it can't be used to find accounts), but a code is only sent if it does.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [PhoneCodeThrottle]

    def post(self, request):
        purpose = request.data.get('purpose')
        if purpose not in PhoneCode.Purpose.values:
            return Response({'purpose': ['Must be "register" or "reset".']}, status=400)
        phone = _phone(request.data.get('phone'))
        if not phone:
            return Response({'phone': ['Enter a phone number, e.g. 077 123 4567.']}, status=400)
        exists = User.objects.filter(username=phone).exists()
        if purpose == PhoneCode.Purpose.REGISTER and exists:
            return Response({'phone': ['An account with this phone number already exists. Sign in instead.']}, status=400)
        reply = {'detail': 'Code sent.', 'resend_after': 60}
        if purpose == PhoneCode.Purpose.RESET and not exists:
            return Response(reply)
        try:
            send_code(phone, purpose)
        except TooSoon as exc:
            return Response(
                {'detail': 'Please wait before asking for another code.', 'code': 'too_soon', 'retry_after': exc.retry_after},
                status=429,
            )
        except SmsError:
            return Response(
                {'detail': "We couldn't send the SMS just now. Please try again later.", 'code': 'sms_failed'},
                status=503,
            )
        return Response(reply)


class PhonePasswordResetView(APIView):
    """POST {phone, code, password}: sets a new password for a phone account, using the code
    texted by PhoneCodeView (purpose "reset")."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetThrottle]

    def post(self, request):
        phone = _phone(request.data.get('phone'))
        user = User.objects.filter(username=phone, is_active=True).first() if phone else None
        record = check_code(phone, PhoneCode.Purpose.RESET, str(request.data.get('code', ''))) if user else None
        if record is None:
            return Response({'code': [WRONG_CODE]}, status=400)
        password = str(request.data.get('password', ''))
        try:
            validate_password(password, user=user)
        except DjangoValidationError as exc:
            return Response({'password': exc.messages}, status=400)
        use_code(record)
        user.set_password(password)
        user.save(update_fields=['password'])
        return Response({'detail': 'Your password has been changed.'})


class PasswordResetConfirmView(APIView):
    """GET ?uid&token: {valid}, so the page can say straight away that a link has expired.
    POST {uid, token, password}: sets the new password if the link is still valid."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetThrottle]

    def get_throttles(self):
        return [] if self.request.method == 'GET' else super().get_throttles()

    def get(self, request):
        user = user_for_token(request.query_params.get('uid', ''), request.query_params.get('token', ''))
        return Response({'valid': user is not None})

    def post(self, request):
        user = user_for_token(str(request.data.get('uid', '')), str(request.data.get('token', '')))
        if user is None:
            return Response({'detail': 'This reset link is invalid or has expired.', 'code': 'invalid_link'}, status=400)
        password = str(request.data.get('password', ''))
        try:
            validate_password(password, user=user)
        except DjangoValidationError as exc:
            return Response({'password': exc.messages}, status=400)
        user.set_password(password)
        user.save(update_fields=['password'])  # also makes this link (and any older one) stop working
        return Response({'detail': 'Your password has been changed.'})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class GoogleLoginView(APIView):
    """Exchanges a Google Identity Services credential (ID token) for our own JWT pair.

    This is the modern Google Sign-In flow: the frontend renders Google's button,
    receives a signed credential JWT straight from Google, and hands it to us here
    to verify — no OAuth redirect/callback dance needed.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {'detail': 'Google sign-in is not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        credential = request.data.get('credential')
        if not credential:
            return Response({'detail': 'Missing credential.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from google.auth.transport import requests as google_requests
            from google.oauth2 import id_token as google_id_token

            payload = google_id_token.verify_oauth2_token(
                credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except Exception:
            return Response({'detail': 'Invalid Google credential.'}, status=status.HTTP_400_BAD_REQUEST)

        email = payload.get('email')
        if not email:
            return Response({'detail': 'Google account has no email.'}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': payload.get('given_name', ''),
                'last_name': payload.get('family_name', ''),
            },
        )
        if created:
            user.set_unusable_password()
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({'access': str(refresh.access_token), 'refresh': str(refresh)})


class FavoriteListCreateView(generics.ListCreateAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('property')

    def create(self, request, *args, **kwargs):
        property_id = request.data.get('property_id')
        property_obj = get_object_or_404(Property, pk=property_id)
        favorite, created = Favorite.objects.get_or_create(user=request.user, property=property_obj)
        serializer = self.get_serializer(favorite)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class FavoriteDestroyView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def get_object(self):
        return get_object_or_404(self.get_queryset(), property_id=self.kwargs['property_id'])
