import uuid
from django.db import models


class Environment(models.Model):
    ENV_PRODUCTION = "production"
    ENV_STAGING = "staging"
    ENV_DEVELOPMENT = "development"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_id = models.UUIDField(db_index=True)
    org_id = models.UUIDField(db_index=True)
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default="#6366f1")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "environments"
        unique_together = [("project_id", "name")]
        ordering = ["name"]

    def __str__(self):
        return f"{self.project_id}/{self.name}"


class Secret(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    environment = models.ForeignKey(Environment, on_delete=models.CASCADE, related_name="secrets")
    key = models.CharField(max_length=500)
    encrypted_value = models.TextField()
    iv = models.CharField(max_length=255)
    current_version = models.PositiveIntegerField(default=1)
    is_deleted = models.BooleanField(default=False)
    created_by_id = models.UUIDField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "secrets"
        unique_together = [("environment", "key")]
        indexes = [
            models.Index(
                fields=["environment", "key"],
                condition=models.Q(is_deleted=False),
                name="idx_secrets_env_key_active",
            )
        ]

    def __str__(self):
        return f"{self.environment}/{self.key}"


class SecretVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    secret = models.ForeignKey(Secret, on_delete=models.CASCADE, related_name="versions")
    encrypted_value = models.TextField()
    iv = models.CharField(max_length=255)
    version_number = models.PositiveIntegerField()
    created_by_id = models.UUIDField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "secret_versions"
        unique_together = [("secret", "version_number")]
        ordering = ["-version_number"]
        indexes = [models.Index(fields=["secret_id"], name="idx_secret_versions_secret")]
