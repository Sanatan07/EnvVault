from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    org_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["email", "password", "full_name", "org_name"]

    def create(self, validated_data):
        org_name = validated_data.pop("org_name", None)
        user = User.objects.create_user(**validated_data)
        if org_name:
            from organisations.services import OrganisationService
            OrganisationService.create_with_owner(name=org_name, owner=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name"]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
