from django.contrib import admin
from .models import APIToken


@admin.register(APIToken)
class APITokenAdmin(admin.ModelAdmin):
    list_display = ["name", "project_id", "scopes", "expires_at", "last_used_at", "created_at"]
    list_filter = ["scopes"]
    search_fields = ["name"]
    readonly_fields = ["token_hash"]
