import pytest
from organisations.models import Organisation, Member, Project
from users.models import User


@pytest.fixture
def user(db):
    return User.objects.create_user(email="owner@example.com", password="pass123")


@pytest.mark.django_db
class TestOrganisationService:
    def test_create_with_owner(self, user):
        from organisations.services import OrganisationService
        org = OrganisationService.create_with_owner(name="Test Org", owner=user)
        assert org.name == "Test Org"
        assert org.slug == "test-org"
        assert Member.objects.filter(organisation=org, user=user, role=Member.ROLE_OWNER).exists()

    def test_slug_deduplication(self, user):
        from organisations.services import OrganisationService
        org1 = OrganisationService.create_with_owner(name="Test Org", owner=user)
        user2 = User.objects.create_user(email="other@example.com", password="pass123")
        org2 = OrganisationService.create_with_owner(name="Test Org", owner=user2)
        assert org2.slug != org1.slug
        assert org2.slug == "test-org-1"


@pytest.mark.django_db
class TestMemberPermissions:
    def test_owner_can_admin(self, user):
        from organisations.services import OrganisationService
        org = OrganisationService.create_with_owner(name="My Org", owner=user)
        member = Member.objects.get(organisation=org, user=user)
        assert member.can_admin()
        assert member.can_write()

    def test_viewer_cannot_write(self, user):
        from organisations.services import OrganisationService
        org = OrganisationService.create_with_owner(name="My Org", owner=user)
        viewer = User.objects.create_user(email="viewer@example.com", password="pass")
        member = Member.objects.create(organisation=org, user=viewer, role=Member.ROLE_VIEWER)
        assert not member.can_write()
        assert not member.can_admin()
