import secrets
from datetime import timedelta

from django.utils import timezone
from django.utils.text import slugify

from .models import Organisation, Member, Invitation, Project


class OrganisationService:
    @staticmethod
    def create_with_owner(name: str, owner) -> Organisation:
        slug = slugify(name)
        base_slug = slug
        counter = 1
        while Organisation.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        org = Organisation.objects.create(name=name, slug=slug)
        Member.objects.create(organisation=org, user=owner, role=Member.ROLE_OWNER)
        return org

    @staticmethod
    def invite_member(org: Organisation, email: str, role: str, invited_by) -> Invitation:
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(days=7)
        invitation, _ = Invitation.objects.update_or_create(
            organisation=org,
            email=email,
            defaults={
                "role": role,
                "token": token,
                "status": Invitation.STATUS_PENDING,
                "invited_by": invited_by,
                "expires_at": expires_at,
            },
        )
        return invitation

    @staticmethod
    def accept_invitation(token: str, user) -> Member:
        invitation = Invitation.objects.get(token=token, status=Invitation.STATUS_PENDING)
        if invitation.expires_at < timezone.now():
            invitation.status = Invitation.STATUS_EXPIRED
            invitation.save()
            raise ValueError("Invitation has expired")
        member, _ = Member.objects.get_or_create(
            organisation=invitation.organisation,
            user=user,
            defaults={"role": invitation.role},
        )
        invitation.status = Invitation.STATUS_ACCEPTED
        invitation.save()
        return member


class ProjectService:
    @staticmethod
    def create(org: Organisation, name: str, created_by, description: str = "") -> Project:
        slug = slugify(name)
        base_slug = slug
        counter = 1
        while Project.objects.filter(organisation=org, slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return Project.objects.create(
            organisation=org,
            name=name,
            slug=slug,
            description=description,
            created_by=created_by,
        )
