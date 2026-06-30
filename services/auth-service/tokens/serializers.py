from rest_framework import serializers
from .models import APIToken


class APITokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIToken
        fields = [
            "id", "name", "scopes", "environment",
            "expires_at", "last_used_at", "created_at",
        ]
        read_only_fields = ["id", "last_used_at", "created_at"]


class APITokenCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    scopes = serializers.ListField(
        child=serializers.ChoiceField(choices=APIToken.SCOPE_CHOICES),
        default=["read"],
    )
    environment = serializers.CharField(max_length=100, required=False, allow_blank=True)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class APITokenCreatedSerializer(serializers.ModelSerializer):
    token = serializers.CharField()

    class Meta:
        model = APIToken
        fields = ["id", "name", "scopes", "environment", "expires_at", "created_at", "token"]
