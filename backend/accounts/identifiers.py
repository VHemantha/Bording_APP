"""People sign up and sign in with an email address or a phone number ("identifier").

Phone numbers are stored in one canonical form (+94771234567) as the account's username, so
"077 123 4567", "0771234567" and "+94 77 123 4567" are all the same account. Email accounts
keep using the email address as their username (as they always have).
"""
import re

from django.core.exceptions import ValidationError
from django.core.validators import validate_email

SRI_LANKA_CODE = '94'


def normalize_phone(value):
    """Returns the phone number as +<country><number>, or None if it isn't a phone number.

    A local Sri Lankan number (leading 0, 10 digits) gets the +94 country code."""
    raw = (value or '').strip()
    if not re.fullmatch(r'\+?[\d\s().-]+', raw):
        return None
    digits = re.sub(r'\D', '', raw)
    if raw.startswith('+'):
        number = digits
    elif digits.startswith('0') and len(digits) == 10:
        number = SRI_LANKA_CODE + digits[1:]
    elif digits.startswith(SRI_LANKA_CODE) and len(digits) == 11:
        number = digits
    else:
        number = digits
    return f'+{number}' if 9 <= len(number) <= 15 else None


def parse_identifier(value):
    """('email', address) or ('phone', +94...) for what someone typed; raises ValidationError."""
    text = (value or '').strip()
    if '@' in text:
        try:
            validate_email(text)
        except ValidationError:
            raise ValidationError('Enter a valid email address.') from None
        return 'email', text.lower()
    phone = normalize_phone(text)
    if phone:
        return 'phone', phone
    raise ValidationError('Enter an email address or a phone number, e.g. 077 123 4567.')
