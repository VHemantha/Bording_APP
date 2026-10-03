from django.db import transaction
from django.db.models import Count
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from ai_agent.throttles import AIRateThrottle

from .filters import PropertyFilter
from .media import InvalidImage, delete_uploaded_photos, save_listing_photo
from .models import Property
from .permissions import IsOwnerOrAdminOrReadOnly, can_manage
from .serializers import (
    InquirySerializer,
    MyListingSerializer,
    PropertyDetailSerializer,
    PropertyListSerializer,
    PropertyWriteSerializer,
)


class InquiryThrottle(AIRateThrottle):
    """Caps anonymous "Contact owner" messages per visitor IP (rate: 'inquiry' in settings)."""

    scope = 'inquiry'


class UploadThrottle(AIRateThrottle):
    scope = 'upload'

    def get_cache_key(self, request, view):
        # Uploads need a sign-in, so count per user rather than per IP.
        return self.cache_format % {'scope': self.scope, 'ident': request.user.pk}


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.prefetch_related('images').all()
    filterset_class = PropertyFilter
    permission_classes = [IsOwnerOrAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PropertyDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return PropertyWriteSerializer
        return PropertyListSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_destroy(self, instance):
        photos = {instance.primary_image_url, *instance.images.values_list('image_url', flat=True)}
        instance.delete()
        transaction.on_commit(lambda: delete_uploaded_photos(photos))

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        """The signed-in user's own listings, newest first, with their message counts."""
        listings = Property.objects.filter(owner=request.user).annotate(inquiry_count=Count('inquiries'))
        return Response(MyListingSerializer(listings, many=True).data)

    @action(
        detail=False,
        methods=['post'],
        url_path='upload-photo',
        permission_classes=[permissions.IsAuthenticated],
        parser_classes=[MultiPartParser],
        throttle_classes=[UploadThrottle],
    )
    def upload_photo(self, request):
        upload = request.FILES.get('photo')
        if upload is None:
            return Response({'detail': 'Attach a photo in the "photo" field.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            url = save_listing_photo(upload)
        except InvalidImage as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'url': url}, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=['get', 'post'],
        permission_classes=[permissions.AllowAny],
        throttle_classes=[InquiryThrottle],
    )
    def inquiries(self, request, pk=None):
        """POST: anyone sends the owner a message. GET: the owner (or an admin) reads them."""
        listing = self.get_object()
        if request.method == 'GET':
            if not can_manage(request.user, listing):
                raise PermissionDenied('Only the owner can read messages for this listing.')
            return Response(InquirySerializer(listing.inquiries.all(), many=True).data)

        serializer = InquirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sender = request.user if request.user.is_authenticated else None
        serializer.save(property=listing, sender=sender)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_throttles(self):
        # The upload/inquiry throttles only apply to their own actions, and reading the
        # messages (GET) is never throttled.
        if self.action == 'inquiries' and self.request.method == 'GET':
            return []
        return super().get_throttles()
