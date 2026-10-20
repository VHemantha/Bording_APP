"""One-time codes sent by SMS: to verify the phone number when an account is created with it,
and to reset the password of an account that signed up with a phone number.

Codes are 6 digits, valid for CODE_MINUTES and MAX_ATTEMPTS guesses, and only a keyed hash is
stored. Kept in the database (not the cache) so every server process sees the same codes.
"""
import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import PhoneCode
from .sms import send_sms

CODE_MINUTES = 10
MAX_ATTEMPTS = 5
RESEND_SECONDS = 60
MAX_PER_HOUR = 5

MESSAGES = {
    PhoneCode.Purpose.REGISTER: 'Your PlaceEka verification code is {code}. It expires in {minutes} minutes.',
    PhoneCode.Purpose.RESET: 'Your PlaceEka password reset code is {code}. It expires in {minutes} minutes. '
                             "If you didn't ask for it, ignore this message.",
}


class TooSoon(Exception):
    def __init__(self, retry_after):
        super().__init__(retry_after)
        self.retry_after = retry_after


def _digest(phone, purpose, code):
    key = settings.SECRET_KEY.encode()
    return hmac.new(key, f'{phone}|{purpose}|{code}'.encode(), hashlib.sha256).hexdigest()


def send_code(phone, purpose):
    """Creates a code and texts it. Raises TooSoon if the number asked too recently or too
    often, or sms.SmsError if the SMS couldn't be sent."""
    now = timezone.now()
    recent = PhoneCode.objects.filter(phone=phone, purpose=purpose, created_at__gte=now - timedelta(hours=1))
    last = recent.order_by('-created_at').first()
    if last and (now - last.created_at).total_seconds() < RESEND_SECONDS:
        raise TooSoon(RESEND_SECONDS - int((now - last.created_at).total_seconds()))
    if recent.count() >= MAX_PER_HOUR:
        oldest = recent.order_by('created_at').first()
        raise TooSoon(int((oldest.created_at + timedelta(hours=1) - now).total_seconds()) + 1)

    code = f'{secrets.randbelow(1_000_000):06d}'
    # Only the newest code for a number works.
    PhoneCode.objects.filter(phone=phone, purpose=purpose, used_at=None).update(used_at=now)
    record = PhoneCode.objects.create(
        phone=phone, purpose=purpose, code_hash=_digest(phone, purpose, code),
        expires_at=now + timedelta(minutes=CODE_MINUTES),
    )
    try:
        send_sms(phone, MESSAGES[purpose].format(code=code, minutes=CODE_MINUTES))
    except Exception:
        record.delete()  # not sent: don't count it against the number
        raise


def check_code(phone, purpose, code):
    """The valid, unused code record for `phone` if `code` matches it, else None. A wrong
    guess uses up one of the code's attempts."""
    now = timezone.now()
    record = (
        PhoneCode.objects.filter(phone=phone, purpose=purpose, used_at=None, expires_at__gt=now)
        .order_by('-created_at').first()
    )
    if not record or record.attempts >= MAX_ATTEMPTS:
        return None
    if not hmac.compare_digest(record.code_hash, _digest(phone, purpose, str(code).strip())):
        record.attempts += 1
        record.save(update_fields=['attempts'])
        return None
    return record


def use_code(record):
    record.used_at = timezone.now()
    record.save(update_fields=['used_at'])
