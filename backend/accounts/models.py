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
