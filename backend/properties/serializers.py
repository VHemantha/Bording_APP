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


class PropertyWriteSerializer(serializers.ModelSerializer):
    """Used by the admin dashboard for both manual entry and AI-assisted publishing.

    Accepts an optional flat list of extra photo URLs under `images`; on update
    the existing gallery is replaced wholesale, which keeps the reordering UI simple.
    """

    images = serializers.ListField(child=serializers.URLField(), required=False, write_only=True)

    class Meta:
        model = Property
        fields = [
            'id', 'address', 'city', 'state', 'zip_code',
            'latitude', 'longitude', 'price', 'beds', 'baths',
            'sqft', 'home_type', 'status', 'description',
            'year_built', 'primary_image_url', 'listed_date', 'images',
        ]

    def create(self, validated_data):
        image_urls = validated_data.pop('images', [])
        property_obj = Property.objects.create(**validated_data)
        self._sync_images(property_obj, image_urls)
        return property_obj

    def update(self, instance, validated_data):
        image_urls = validated_data.pop('images', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if image_urls is not None:
            self._sync_images(instance, image_urls)
        return instance

    @staticmethod
    def _sync_images(property_obj, image_urls):
        if not image_urls:
            return
        property_obj.images.all().delete()
        PropertyImage.objects.bulk_create([
            PropertyImage(property=property_obj, image_url=url, ordering=i)
            for i, url in enumerate(image_urls)
        ])

    def to_representation(self, instance):
        return PropertyDetailSerializer(instance, context=self.context).data
