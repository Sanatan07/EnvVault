from rest_framework import serializers
from .models import Environment, Secret, SecretVersion


class EnvironmentSerializer(serializers.ModelSerializer):
    secret_count = serializers.SerializerMethodField()

    class Meta:
        model = Environment
        fields = ["id", "name", "color", "project_id", "secret_count", "created_at"]
        read_only_fields = ["id", "project_id", "created_at"]

    def get_secret_count(self, obj):
        return obj.secrets.filter(is_deleted=False).count()


class EnvironmentCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    color = serializers.CharField(max_length=20, required=False, default="#6366f1")


class SecretSerializer(serializers.ModelSerializer):
    needs_rotation = serializers.SerializerMethodField()

    class Meta:
        model = Secret
        fields = ["id", "key", "current_version", "needs_rotation", "created_at", "updated_at"]
        read_only_fields = ["id", "current_version", "needs_rotation", "created_at", "updated_at"]

    def get_needs_rotation(self, obj):
        from datetime import timedelta
        from django.utils import timezone
        return obj.updated_at < timezone.now() - timedelta(days=90)


class SecretDetailSerializer(serializers.ModelSerializer):
    value = serializers.CharField()
    needs_rotation = serializers.SerializerMethodField()

    class Meta:
        model = Secret
        fields = ["id", "key", "value", "current_version", "needs_rotation", "created_at", "updated_at"]

    def get_needs_rotation(self, obj):
        from datetime import timedelta
        from django.utils import timezone
        return obj.updated_at < timezone.now() - timedelta(days=90)


class SecretCreateSerializer(serializers.Serializer):
    key = serializers.RegexField(
        r"^[A-Za-z_][A-Za-z0-9_]*$",
        max_length=500,
        error_messages={"invalid": "Secret key must be a valid identifier (A-Z, a-z, 0-9, _)."},
    )
    value = serializers.CharField()


class SecretUpdateSerializer(serializers.Serializer):
    value = serializers.CharField()


class SecretVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecretVersion
        fields = ["id", "version_number", "created_by_id", "created_at"]
        read_only_fields = ["id", "created_at"]
