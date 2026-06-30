import uuid
from django.db import models


class APIToken(models.Model):
    SCOPE_READ = "read"
    SCOPE_WRITE = "write"
    SCOPE_READ_WRITE = "read:write"
    SCOPE_CHOICES = [
        (SCOPE_READ, "Read"),
        (SCOPE_WRITE, "Write"),
        (SCOPE_READ_WRITE, "Read + Write"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_id = models.UUIDField()
    name = models.CharField(max_length=255)
    token_hash = models.CharField(max_length=255, unique=True)
    scopes = models.JSONField(default=list)
    environment = models.CharField(max_length=100, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_by_id = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "api_tokens"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def is_expired(self):
        if not self.expires_at:
            return False
        from django.utils import timezone
        return self.expires_at < timezone.now()

    def can_read(self):
        return self.SCOPE_READ in self.scopes or self.SCOPE_READ_WRITE in self.scopes

    def can_write(self):
        return self.SCOPE_WRITE in self.scopes or self.SCOPE_READ_WRITE in self.scopes
