import uuid
from django.conf import settings
from django.db import models


class Organisation(models.Model):
    PLAN_FREE = "free"
    PLAN_STARTER = "starter"
    PLAN_GROWTH = "growth"
    PLAN_ENTERPRISE = "enterprise"
    PLAN_CHOICES = [
        (PLAN_FREE, "Free"),
        (PLAN_STARTER, "Starter"),
        (PLAN_GROWTH, "Growth"),
        (PLAN_ENTERPRISE, "Enterprise"),
    ]

    PLAN_LIMITS = {
        PLAN_FREE: {"projects": 1, "secrets": 10, "reads_per_month": 500},
        PLAN_STARTER: {"projects": 5, "secrets": None, "reads_per_month": 10000},
        PLAN_GROWTH: {"projects": 20, "secrets": None, "reads_per_month": 50000},
        PLAN_ENTERPRISE: {"projects": None, "secrets": None, "reads_per_month": None},
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    plan = models.CharField(max_length=50, choices=PLAN_CHOICES, default=PLAN_FREE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "organisations"
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def limits(self):
        return self.PLAN_LIMITS[self.plan]


class Member(models.Model):
    ROLE_OWNER = "owner"
    ROLE_ADMIN = "admin"
    ROLE_EDITOR = "editor"
    ROLE_VIEWER = "viewer"
    ROLE_CHOICES = [
        (ROLE_OWNER, "Owner"),
        (ROLE_ADMIN, "Admin"),
        (ROLE_EDITOR, "Editor"),
        (ROLE_VIEWER, "Viewer"),
    ]
    ROLE_HIERARCHY = {ROLE_OWNER: 4, ROLE_ADMIN: 3, ROLE_EDITOR: 2, ROLE_VIEWER: 1}

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default=ROLE_VIEWER)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "members"
        unique_together = [("organisation", "user")]

    def __str__(self):
        return f"{self.user.email} @ {self.organisation.name} ({self.role})"

    def can_write(self):
        return self.ROLE_HIERARCHY[self.role] >= self.ROLE_HIERARCHY[self.ROLE_EDITOR]

    def can_admin(self):
        return self.ROLE_HIERARCHY[self.role] >= self.ROLE_HIERARCHY[self.ROLE_ADMIN]


class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name="projects")
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_projects"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projects"
        unique_together = [("organisation", "slug")]
        ordering = ["name"]

    def __str__(self):
        return f"{self.organisation.slug}/{self.slug}"


class Invitation(models.Model):
    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_EXPIRED = "expired"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name="invitations")
    email = models.EmailField()
    role = models.CharField(max_length=50, choices=Member.ROLE_CHOICES, default=Member.ROLE_VIEWER)
    token = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=50, default=STATUS_PENDING)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "invitations"
