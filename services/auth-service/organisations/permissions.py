from rest_framework.permissions import BasePermission
from .models import Member


class IsOrgMember(BasePermission):
    def has_permission(self, request, view):
        org_id = view.kwargs.get("org_id")
        if not org_id:
            return False
        return Member.objects.filter(organisation_id=org_id, user=request.user).exists()


class IsOrgAdmin(BasePermission):
    def has_permission(self, request, view):
        org_id = view.kwargs.get("org_id")
        if not org_id:
            return False
        member = Member.objects.filter(organisation_id=org_id, user=request.user).first()
        return member is not None and member.can_admin()


class IsOrgOwner(BasePermission):
    def has_permission(self, request, view):
        org_id = view.kwargs.get("org_id")
        if not org_id:
            return False
        return Member.objects.filter(
            organisation_id=org_id, user=request.user, role=Member.ROLE_OWNER
        ).exists()
