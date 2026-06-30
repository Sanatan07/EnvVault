from rest_framework import serializers
from .models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEvent
        fields = [
            "id", "org_id", "project_id", "environment_name",
            "actor_type", "actor_id", "actor_email",
            "secret_key", "action",
            "ip_address", "user_agent", "metadata", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AuditEventIngestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEvent
        fields = [
            "org_id", "project_id", "environment_name",
            "actor_type", "actor_id", "actor_email",
            "secret_key", "action",
            "ip_address", "user_agent", "metadata",
        ]
