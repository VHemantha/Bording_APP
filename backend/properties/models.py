from django.db import models


class Property(models.Model):
    class HomeType(models.TextChoices):
        HOUSE = 'house', 'House'
        CONDO = 'condo', 'Condo'
        TOWNHOUSE = 'townhouse', 'Townhouse'
        APARTMENT = 'apartment', 'Apartment'

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
