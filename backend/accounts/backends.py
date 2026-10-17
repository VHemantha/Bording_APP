from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.core.exceptions import ValidationError

from .identifiers import parse_identifier


class EmailOrPhoneBackend(ModelBackend):
    """Signs people in with their email address or phone number (any common format) and their
    password. The JWT login endpoint passes whatever was typed as `username`."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or password is None:
            return None
        User = get_user_model()
        try:
            kind, value = parse_identifier(username)
        except ValidationError:
            return None  # not an email or phone; the default backend still tries plain usernames
        if kind == 'email':
            user = (
                User.objects.filter(email__iexact=value).order_by('date_joined').first()
                or User.objects.filter(username__iexact=value).first()
            )
        else:
            user = User.objects.filter(username=value).first()
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        if user is None:
            # Same cost as a real check, so response time doesn't reveal which accounts exist.
            User().set_password(password)
        return None
