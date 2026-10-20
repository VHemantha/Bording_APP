import re

from django.db import transaction
from rest_framework import serializers

from .media import delete_uploaded_photos, is_valid_photo_reference
from .models import Inquiry, Property, PropertyImage
from .permissions import can_manage
from .video import normalize_youtube_url

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
    youtube_id = serializers.CharField(read_only=True)

    class Meta:
        model = Property
        fields = [
            'id', 'address', 'city', 'district', 'state', 'zip_code',
            'latitude', 'longitude', 'price', 'beds', 'baths',
            'sqft', 'land_size', 'land_unit', 'shared_bathroom', 'home_type', 'status', 'key_money_months', 'advance_amount',
            'deed_type', 'video_url', 'youtube_id',
            'parking_slots',
            'stories', 'furnishing', 'primary_image_url',
        ]


class PropertyDetailSerializer(serializers.ModelSerializer):
    youtube_id = serializers.CharField(read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)
    # True when the viewer may edit/delete it (its owner, or an admin).
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id', 'address', 'city', 'district', 'state', 'zip_code',
            'latitude', 'longitude', 'price', 'beds', 'baths',
            'sqft', 'land_size', 'land_unit', 'shared_bathroom', 'home_type', 'status', 'key_money_months', 'advance_amount',
            'deed_type', 'video_url', 'youtube_id',
            'parking_slots',
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
            'id', 'address', 'city', 'district', 'state', 'zip_code',
            'latitude', 'longitude', 'price', 'beds', 'baths',
            'sqft', 'land_size', 'land_unit', 'shared_bathroom', 'home_type', 'status', 'key_money_months', 'advance_amount',
            'deed_type', 'video_url', 'youtube_id',
            'parking_slots',
            'stories', 'furnishing', 'description',
            'year_built', 'primary_image_url', 'listed_date', 'images',
            'contact_name', 'contact_phone',
        ]
        extra_kwargs = {'listed_date': {'required': False}}

    def validate_video_url(self, value):
        normalized = normalize_youtube_url(value)
        if normalized is None:
            raise serializers.ValidationError('Paste a YouTube link, e.g. https://youtu.be/abc123XYZ_0.')
        return normalized

    def validate(self, attrs):
        current = lambda field, default=None: attrs.get(field, getattr(self.instance, field, default))  # noqa: E731
        status = current('status', Property.Status.FOR_RENT)
        home_type = current('home_type')
        if status == Property.Status.FOR_SALE and home_type == Property.HomeType.SHOP:
            # For sale, shops and commercial property are one type ("Shop / commercial").
            attrs['home_type'] = home_type = Property.HomeType.COMMERCIAL
        if status == Property.Status.FOR_SALE and home_type in Property.RENT_ONLY_TYPES:
            raise serializers.ValidationError({'home_type': 'Annexes and upper floor houses can only be rented out.'})

        # Only the details this kind of listing has (Property.fields_for); the rest are cleared.
        fields = Property.fields_for(status, home_type)
        if 'sqft' in fields and home_type in Property.SQFT_REQUIRED_TYPES and not current('sqft'):
            raise serializers.ValidationError({'sqft': 'Square feet is required for shops and commercial properties.'})
        if 'land_size' in fields:
            land_size = current('land_size')
            if not land_size or land_size <= 0:
                raise serializers.ValidationError({'land_size': 'Give the land size in perches or acres.'})
        else:
            attrs['land_size'] = None
        if 'deed_type' in fields:
            if not current('deed_type'):
                raise serializers.ValidationError({'deed_type': 'Choose the deed type.'})
        else:
            attrs['deed_type'] = ''
        if 'rooms' not in fields:
            attrs.update(beds=0, baths=0)
        if 'shared_bathroom' not in fields:
            attrs['shared_bathroom'] = False
        if 'stories' not in fields:
            attrs['stories'] = None
        if 'furnishing' not in fields:
            attrs['furnishing'] = Property.Furnishing.UNFURNISHED
        if 'sqft' not in fields:
            attrs['sqft'] = None
        if 'parking' not in fields:
            attrs['parking_slots'] = 0
        if 'key_money' not in fields:
            attrs['key_money_months'] = 0
        attrs['advance_amount'] = None  # no longer part of a listing
        if attrs.get('shared_bathroom'):
            attrs['baths'] = 1  # "one shared bathroom"
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
