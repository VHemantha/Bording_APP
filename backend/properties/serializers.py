from rest_framework import serializers

from .models import Property, PropertyImage


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image_url', 'ordering']


class PropertyListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            'id', 'address', 'city', 'state', 'zip_code',
            'latitude', 'longitude', 'price', 'beds', 'baths',
            'sqft', 'home_type', 'status', 'primary_image_url',
        ]


class PropertyDetailSerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = [
            'id', 'address', 'city', 'state', 'zip_code',
            'latitude', 'longitude', 'price', 'beds', 'baths',
            'sqft', 'home_type', 'status', 'description',
            'year_built', 'primary_image_url', 'listed_date', 'images',
        ]
