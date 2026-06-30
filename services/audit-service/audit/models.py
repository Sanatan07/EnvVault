import uuid
from django.db import models


class AuditEvent(models.Model):
    ACTION_READ = "read"
    ACTION_WRITE = "write"
    ACTION_DELETE = "delete"
    ACTION_ROLLBACK = "rollback"
    ACTION_EXPORT = "export"
    ACTION_IMPORT = "import"
    ACTION_LOGIN = "login"
    ACTION_LOGOUT = "logout"

    ACTOR_MEMBER = "member"
    ACTOR_API_TOKEN = "api_token"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    project_id = models.UUIDField(db_index=True, null=True)
    environment_name = models.CharField(max_length=100, blank=True)
    actor_type = models.CharField(max_length=50)
    actor_id = models.UUIDField(db_index=True)
    actor_email = models.CharField(max_length=255, blank=True)
    secret_key = models.CharField(max_length=500, blank=True)
    action = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_events"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["org_id", "-created_at"], name="idx_audit_org"),
            models.Index(fields=["project_id", "-created_at"], name="idx_audit_project"),
            models.Index(fields=["actor_id", "-created_at"], name="idx_audit_actor"),
        ]

    def __str__(self):
        return f"{self.actor_email} {self.action} {self.secret_key} @ {self.created_at}"
