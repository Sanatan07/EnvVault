from django.contrib import admin
from .models import Environment, Secret, SecretVersion


@admin.register(Environment)
class EnvironmentAdmin(admin.ModelAdmin):
    list_display = ["name", "project_id", "org_id", "created_at"]
    search_fields = ["name"]


@admin.register(Secret)
class SecretAdmin(admin.ModelAdmin):
    list_display = ["key", "environment", "current_version", "is_deleted", "updated_at"]
    list_filter = ["is_deleted"]
    search_fields = ["key"]
    readonly_fields = ["encrypted_value", "iv"]


@admin.register(SecretVersion)
class SecretVersionAdmin(admin.ModelAdmin):
    list_display = ["secret", "version_number", "created_at"]
    readonly_fields = ["encrypted_value", "iv"]
