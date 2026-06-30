from django.contrib import admin
from .models import Organisation, Member, Project, Invitation


@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "plan", "created_at"]
    list_filter = ["plan"]
    search_fields = ["name", "slug"]


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ["user", "organisation", "role", "created_at"]
    list_filter = ["role"]
    search_fields = ["user__email", "organisation__name"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "organisation", "created_at"]
    search_fields = ["name", "slug"]


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ["email", "organisation", "role", "status", "expires_at"]
    list_filter = ["status", "role"]
