import re

from django.db import transaction
from rest_framework import serializers

from .media import delete_uploaded_photos, is_valid_photo_reference
from .models import Inquiry, Property, PropertyImage
from .permissions import can_manage

PHONE_RE = re.compile(r'^\+?[0-9 ()-]{7,20}$')


def validate_photo(value):
    if not is_valid_photo_reference(value):
        raise serializers.ValidationError('Enter a full http(s) URL or upload a photo.')
    return value


def validate_phone(value):
    if value and not PHONE_RE.match(value):
        raise serializers.ValidationError('Enter a valid phone number, e.g. +94 77 123 4567.')
    return value


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
            'sqft', 'home_type', 'status', 'key_money_months', 'parking_slots',
            'stories', 'furnishing', 'primary_image_url',
        ]


class PropertyDetailSerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    # True when the viewer may edit/delete it (its owner, or an admin).
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id', 'address', 'city', 'state', 'zip_code',
            'latitude', 'longitude', 'price', 'beds', 'baths',
            'sqft', 'home_type', 'status', 'key_money_months', 'parking_slots',
            'stories', 'furnishing', 'description',
            'year_built', 'primary_image_url', 'listed_date', 'images',
            'contact_name', 'contact_phone', 'can_edit',
        ]

    def get_can_edit(self, obj):
        request = self.context.get('request')
        return can_manage(getattr(request, 'user', None), obj)


class MyListingSerializer(PropertyListSerializer):
    """The owner's own view of a listing, with how many messages it has received."""

    inquiry_count = serializers.IntegerField(read_only=True)

    class Meta(PropertyListSerializer.Meta):
        fields = [*PropertyListSerializer.Meta.fields, 'listed_date', 'inquiry_count']


class PropertyWriteSerializer(serializers.ModelSerializer):
    """Used for both user posts and the admin dashboard (manual entry and AI import).

    `images` is the full, ordered gallery. On update it replaces the old one, and photos
    uploaded to this site that are no longer used are deleted from storage.
    """

    images = serializers.ListField(
        child=serializers.CharField(max_length=500, validators=[validate_photo]),
        required=False,
        write_only=True,
        max_length=20,
    )
    primary_image_url = serializers.CharField(max_length=500, validators=[validate_photo])
    contact_phone = serializers.CharField(max_length=30, required=False, allow_blank=True, validators=[validate_phone])

    class Meta:
        model = Property
        fields = [
            'id', 'address', 'city', 'state', 'zip_code',
            'latitude', 'longitude', 'price', 'beds', 'baths',
            'sqft', 'home_type', 'status', 'key_money_months', 'parking_slots',
            'stories', 'furnishing', 'description',
            'year_built', 'primary_image_url', 'listed_date', 'images',
            'contact_name', 'contact_phone',
        ]
        extra_kwargs = {'listed_date': {'required': False}}

    def validate(self, attrs):
        for field in ('latitude', 'longitude'):
            value = attrs.get(field)
            limit = 90 if field == 'latitude' else 180
            if value is not None and not -limit <= value <= limit:
                raise serializers.ValidationError({field: 'Choose the location on the map.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        image_urls = validated_data.pop('images', [])
        property_obj = Property.objects.create(**validated_data)
        self._sync_images(property_obj, image_urls)
        return property_obj

    @transaction.atomic
    def update(self, instance, validated_data):
        image_urls = validated_data.pop('images', None)
        before = self._photo_paths(instance)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if image_urls is not None:
            self._sync_images(instance, image_urls)
        removed = before - self._photo_paths(instance)
        transaction.on_commit(lambda: delete_uploaded_photos(removed))
        return instance

    @staticmethod
    def _photo_paths(listing):
        return {listing.primary_image_url, *listing.images.values_list('image_url', flat=True)}

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


class InquirySerializer(serializers.ModelSerializer):
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, validators=[validate_phone])

    class Meta:
        model = Inquiry
        fields = ['id', 'name', 'email', 'phone', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        if not attrs.get('email') and not attrs.get('phone'):
            raise serializers.ValidationError('Give an email address or a phone number so the owner can reply.')
        return attrs
