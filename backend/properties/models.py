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

    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    zip_code = models.CharField(max_length=10)
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

    description = models.TextField(blank=True)
    year_built = models.PositiveSmallIntegerField(null=True, blank=True)
    primary_image_url = models.URLField()
    listed_date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-listed_date']
        verbose_name_plural = 'properties'

    def __str__(self):
        return f'{self.address}, {self.city}, {self.state}'


class PropertyImage(models.Model):
    property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE)
    image_url = models.URLField()
    ordering = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['ordering']

    def __str__(self):
        return f'Image {self.ordering} for {self.property_id}'
