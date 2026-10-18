"""Forgotten-password emails.

Someone types the email address or phone number they signed up with. If that account has an
email address, it gets a link to /reset-password?uid=..&token=.. on the site, valid for
PASSWORD_RESET_TIMEOUT seconds and only until the password changes (Django's token generator
includes the password hash). Phone-only accounts have no address to send to, so nothing is
sent for them; the reply is the same either way, so the form can't be used to find out who
has an account.
"""
import logging
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from .identifiers import parse_identifier

logger = logging.getLogger(__name__)

HOURS = settings.PASSWORD_RESET_TIMEOUT // 3600

MESSAGES = {
    'en': (
        'Reset your PlaceEka password',
        'Hello,\n\n'
        'Someone (hopefully you) asked to reset the password for your PlaceEka account. Open this '
        'link to choose a new password. It works for {hours} hours:\n\n{link}\n\n'
        "If you didn't ask for this, ignore this email; your password stays the same.\n\nPlaceEka",
    ),
    'si': (
        'ඔබේ PlaceEka මුරපදය යළි සකසන්න',
        'ආයුබෝවන්,\n\n'
        'ඔබේ PlaceEka ගිණුමේ මුරපදය යළි සැකසීමට ඉල්ලීමක් ලැබුණි. නව මුරපදයක් තෝරා ගැනීමට මෙම සබැඳිය '
        'විවෘත කරන්න. එය පැය {hours}ක් වලංගුයි:\n\n{link}\n\n'
        'ඔබ මෙය ඉල්ලුවේ නැත්නම්, මෙම ඊමේල් නොසලකා හරින්න; ඔබේ මුරපදය වෙනස් නොවේ.\n\nPlaceEka',
    ),
    'ta': (
        'உங்கள் PlaceEka கடவுச்சொல்லை மீட்டமைக்கவும்',
        'வணக்கம்,\n\n'
        'உங்கள் PlaceEka கணக்கின் கடவுச்சொல்லை மீட்டமைக்கக் கோரிக்கை வந்துள்ளது. புதிய கடவுச்சொல்லைத் '
        'தேர்வுசெய்ய இந்த இணைப்பைத் திறக்கவும். இது {hours} மணி நேரம் செல்லுபடியாகும்:\n\n{link}\n\n'
        'நீங்கள் இதைக் கோரவில்லை என்றால், இந்த மின்னஞ்சலைப் புறக்கணிக்கவும்; உங்கள் கடவுச்சொல் மாறாது.\n\nPlaceEka',
    ),
}


def find_user(identifier):
    """The active account for an email address or phone number, or None."""
    try:
        kind, value = parse_identifier(identifier)
    except ValidationError:
        return None
    users = User.objects.filter(is_active=True)
    if kind == 'email':
        return (
            users.filter(email__iexact=value).order_by('date_joined').first()
            or users.filter(username__iexact=value).first()
        )
    return users.filter(username=value).first()


def site_url(request):
    """Where the reset page lives: SITE_URL if set (production), otherwise the page the request
    came from when that's one of our own origins (local development runs the site on another
    port than the API), otherwise this server."""
    if settings.SITE_URL:
        return settings.SITE_URL.rstrip('/')
    origin = request.headers.get('Origin', '')
    if origin and origin in {*settings.CORS_ALLOWED_ORIGINS, *settings.CSRF_TRUSTED_ORIGINS}:
        return origin
    return request.build_absolute_uri('/').rstrip('/')


def send_reset_email(request, identifier, lang='en'):
    """Emails a reset link if `identifier` belongs to an account with an email address."""
    user = find_user(identifier)
    if not user or not user.email:
        return
    query = urlencode({'uid': urlsafe_base64_encode(force_bytes(user.pk)), 'token': default_token_generator.make_token(user)})
    subject, body = MESSAGES.get(lang, MESSAGES['en'])
    try:
        send_mail(subject, body.format(link=f'{site_url(request)}/reset-password?{query}', hours=HOURS), None, [user.email])
    except Exception:  # the visitor still sees the same reply; the failure is in the server log
        logger.exception('Could not send the password reset email')


def user_for_token(uid, token):
    """The account a reset link belongs to, or None if the link is invalid or expired."""
    try:
        user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)), is_active=True)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return None
    return user if default_token_generator.check_token(user, token) else None
