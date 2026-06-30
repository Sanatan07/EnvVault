from rest_framework import serializers
from .models import NotificationSettings


class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = [
            "id", "org_id", "slack_webhook_url", "custom_webhook_url",
            "notify_on_read", "notify_on_write", "notify_on_delete",
            "notify_on_export", "notify_on_new_ip", "notify_expiry_days_before",
            "updated_at",
        ]
        read_only_fields = ["id", "org_id", "updated_at"]
