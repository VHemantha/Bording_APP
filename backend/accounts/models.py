from django.conf import settings
from django.db import models

from properties.models import Property


class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='favorites', on_delete=models.CASCADE)
    property = models.ForeignKey(Property, related_name='favorited_by', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'property']

    def __str__(self):
        return f'{self.user} -> {self.property_id}'


class PhoneCode(models.Model):
    """A one-time code texted to a phone number (see accounts/otp.py). Only its hash is kept."""

    class Purpose(models.TextChoices):
        REGISTER = 'register', 'Create account'
        RESET = 'reset', 'Reset password'

    phone = models.CharField(max_length=20)  # +94771234567
    purpose = models.CharField(max_length=10, choices=Purpose.choices)
    code_hash = models.CharField(max_length=64)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=['phone', 'purpose', 'created_at'])]

    def __str__(self):
        return f'{self.phone} ({self.purpose})'
