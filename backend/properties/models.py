from datetime import date

from django.conf import settings
from django.db import models


class Property(models.Model):
    class HomeType(models.TextChoices):
        HOUSE = 'house', 'House'
        APARTMENT = 'apartment', 'Apartment'
        ANNEX = 'annex', 'Annex'
        LAND = 'land', 'Land'
        UPPER_FLOOR_HOUSE = 'upper_floor_house', 'Upper floor house'

    class Stories(models.IntegerChoices):
        SINGLE = 1, 'Single story'
        TWO = 2, 'Two story'
        THREE = 3, 'Three story'

    class Status(models.TextChoices):
        FOR_SALE = 'for_sale', 'For Sale'
        FOR_RENT = 'for_rent', 'For Rent'

    class Furnishing(models.TextChoices):
        FURNISHED = 'furnished', 'Furnished'
        UNFURNISHED = 'unfurnished', 'Unfurnished'

    # The user who posted it. Blank for listings added by the site (seed data, older admin
    # entries); those are managed by admins only.
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name='listings', on_delete=models.CASCADE, null=True, blank=True
    )

    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2, blank=True)  # province code, e.g. WP
    zip_code = models.CharField(max_length=10, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()

    price = models.PositiveIntegerField()
    beds = models.PositiveSmallIntegerField()
    baths = models.FloatField()
    sqft = models.PositiveIntegerField()
    home_type = models.CharField(max_length=20, choices=HomeType.choices, default=HomeType.HOUSE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.FOR_SALE)
    # Key money: the advance payment a landlord asks for up front. 0 = none asked.
    key_money = models.PositiveIntegerField(default=0)
    parking_slots = models.PositiveSmallIntegerField(default=0)
    # Blank for listings where it doesn't apply (land).
    stories = models.PositiveSmallIntegerField(choices=Stories.choices, null=True, blank=True)
    furnishing = models.CharField(max_length=20, choices=Furnishing.choices, default=Furnishing.UNFURNISHED)

    # Written by the owner when posting.
    description = models.TextField(blank=True)
    year_built = models.PositiveSmallIntegerField(null=True, blank=True)
    # A full URL, or a /media/... path for a photo uploaded to this site.
    primary_image_url = models.CharField(max_length=500)
    listed_date = models.DateField(default=date.today)

    # Shown on the listing so people can reach the owner directly.
    contact_name = models.CharField(max_length=100, blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-listed_date', '-created_at']
        verbose_name_plural = 'properties'

    def __str__(self):
        return f'{self.address}, {self.city}'


class PropertyImage(models.Model):
    property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE)
    image_url = models.CharField(max_length=500)  # full URL or /media/... path, like primary_image_url
    ordering = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['ordering']

    def __str__(self):
        return f'Image {self.ordering} for {self.property_id}'


class Inquiry(models.Model):
    """A message sent to a listing's owner through the "Contact owner" form."""

    property = models.ForeignKey(Property, related_name='inquiries', on_delete=models.CASCADE)
    # Set when the sender was signed in; the form also works for visitors.
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name='inquiries_sent', on_delete=models.SET_NULL, null=True, blank=True
    )
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    message = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'inquiries'

    def __str__(self):
        return f'{self.name} about {self.property_id}'
