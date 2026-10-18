from datetime import date

from django.conf import settings
from django.core.validators import MaxValueValidator
from django.db import models


class Property(models.Model):
    class HomeType(models.TextChoices):
        HOUSE = 'house', 'House'
        APARTMENT = 'apartment', 'Apartment'
        ANNEX = 'annex', 'Annex'
        LAND = 'land', 'Land'
        UPPER_FLOOR_HOUSE = 'upper_floor_house', 'Upper floor house'
        SHOP = 'shop', 'Shop'
        COMMERCIAL = 'commercial', 'Commercial property'

    # Types whose listings must give a floor area.
    SQFT_REQUIRED_TYPES = ('shop', 'commercial')
    # Types that are only ever rented out, never sold on their own.
    RENT_ONLY_TYPES = ('annex', 'upper_floor_house')
    # Never have a land size, for sale or rent.
    NO_LAND_SIZE_TYPES = ('apartment', 'annex')

    class LandUnit(models.TextChoices):
        PERCH = 'perch', 'Perches'
        ACRE = 'acre', 'Acres'

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
    # The listing has one bathroom, shared with others (e.g. the owner's family or other tenants).
    shared_bathroom = models.BooleanField(default=False)
    # Floor area. Required for shops and commercial properties only (see the write serializer).
    sqft = models.PositiveIntegerField(null=True, blank=True)
    # Size of the land, in perches or acres (1 acre = 160 perches). Required for every type
    # except apartments (see the write serializer).
    land_size = models.FloatField(null=True, blank=True)
    land_unit = models.CharField(max_length=5, choices=LandUnit.choices, default=LandUnit.PERCH)
    home_type = models.CharField(max_length=20, choices=HomeType.choices, default=HomeType.HOUSE)
    # Rent or sale. For a sale, `price` is the sale price; for a rental, the monthly rent.
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.FOR_RENT)
    # Rentals: key money, the advance a landlord asks for up front, in months' rent (0-12).
    key_money_months = models.PositiveSmallIntegerField(default=0, validators=[MaxValueValidator(12)])
    # Sales: the advance (deposit) the buyer pays to reserve the property, in LKR. Blank if none.
    advance_amount = models.PositiveIntegerField(null=True, blank=True)
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

    @classmethod
    def land_size_applies(cls, status, home_type):
        """Whether a listing gives (and must give) its land size: for sale, every type except
        apartments and annexes; for rent, land only."""
        if home_type in cls.NO_LAND_SIZE_TYPES:
            return False
        return status == cls.Status.FOR_SALE or home_type == cls.HomeType.LAND


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


class Place(models.Model):
    """A point of interest for the map's "Nearby places" menu, copied from OpenStreetMap
    (see places.py) so visitors never wait on the slow public Overpass service."""

    osm_id = models.CharField(max_length=24, unique=True)  # e.g. "n123", "w456"
    category = models.CharField(max_length=16)
    name = models.CharField(max_length=200, blank=True)
    lat = models.FloatField()
    lng = models.FloatField()

    class Meta:
        indexes = [models.Index(fields=['category', 'lat', 'lng'])]

    def __str__(self):
        return f'{self.category}: {self.name or self.osm_id}'


class PlaceTile(models.Model):
    """One square of the places grid and when its places were last downloaded."""

    key = models.CharField(max_length=24, unique=True)  # "<row>:<col>" on places.TILE grid
    fetched_at = models.DateTimeField(null=True, blank=True)
    requested_at = models.DateTimeField()  # last time a download was started
    failed_at = models.DateTimeField(null=True, blank=True)  # last download that failed

    def __str__(self):
        return self.key
