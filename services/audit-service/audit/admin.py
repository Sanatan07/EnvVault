from django.contrib import admin
from .models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ["actor_email", "action", "secret_key", "environment_name", "ip_address", "created_at"]
    list_filter = ["action", "actor_type"]
    search_fields = ["actor_email", "secret_key"]
    readonly_fields = [f.name for f in AuditEvent._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
