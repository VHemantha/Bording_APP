from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from properties.serializers import PropertyListSerializer

from .identifiers import parse_identifier
from .models import Favorite, PhoneCode
from .otp import check_code, use_code


class RegisterSerializer(serializers.Serializer):
    """Sign-up with an email address or a phone number (`identifier`) and a password.

    Email accounts use the address as username (as before); phone accounts use the number in
    its canonical +94... form, so the same number can't register twice in different formats.
    A phone number must be confirmed with the code texted to it (`code`, see accounts/otp.py)."""

    identifier = serializers.CharField(max_length=150, write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    code = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=10)

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

    def validate(self, attrs):
        if self._kind == 'phone':
            self._code = check_code(attrs['identifier'], PhoneCode.Purpose.REGISTER, attrs.get('code', ''))
            if self._code is None:
                raise serializers.ValidationError(
                    {'code': 'That code is wrong or has expired. Check the SMS or ask for a new code.'}
                )
        return attrs

    def create(self, validated_data):
        if self._kind == 'phone':
            use_code(self._code)
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
