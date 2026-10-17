from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from properties.serializers import PropertyListSerializer

from .identifiers import parse_identifier
from .models import Favorite


class RegisterSerializer(serializers.Serializer):
    """Sign-up with an email address or a phone number (`identifier`) and a password.

    Email accounts use the address as username (as before); phone accounts use the number in
    its canonical +94... form, so the same number can't register twice in different formats."""

    identifier = serializers.CharField(max_length=150, write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_identifier(self, value):
        try:
            kind, normalized = parse_identifier(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages[0]) from None
        taken = User.objects.filter(username__iexact=normalized)
        if kind == 'email':
            taken = taken | User.objects.filter(email__iexact=normalized)
        if taken.exists():
            raise serializers.ValidationError(
                'An account with this email already exists.' if kind == 'email'
                else 'An account with this phone number already exists.'
            )
        self._kind = kind
        return normalized

    def create(self, validated_data):
        identifier = validated_data['identifier']
        return User.objects.create_user(
            username=identifier,
            email=identifier if self._kind == 'email' else '',
            password=validated_data['password'],
        )

    def to_representation(self, instance):
        return UserSerializer(instance).data


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

    def get_role(self, obj):
        return 'admin' if obj.is_staff else 'user'


class FavoriteSerializer(serializers.ModelSerializer):
    property = PropertyListSerializer(read_only=True)
    property_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'property', 'property_id', 'created_at']
