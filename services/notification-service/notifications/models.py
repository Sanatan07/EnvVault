import uuid
from django.db import models


class NotificationSettings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(unique=True, db_index=True)
    slack_webhook_url = models.URLField(blank=True)
    custom_webhook_url = models.URLField(blank=True)
    notify_on_read = models.BooleanField(default=False)
    notify_on_write = models.BooleanField(default=True)
    notify_on_delete = models.BooleanField(default=True)
    notify_on_export = models.BooleanField(default=True)
    notify_on_new_ip = models.BooleanField(default=True)
    notify_expiry_days_before = models.PositiveIntegerField(default=7)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notification_settings"
