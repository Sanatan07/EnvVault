import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="test@example.com", password="testpass123", full_name="Test User")


@pytest.mark.django_db
class TestRegisterView:
    def test_register_success(self, client):
        response = client.post(
            reverse("register"),
            {"email": "new@example.com", "password": "securepass123", "full_name": "New User"},
        )
        assert response.status_code == 201
        assert "access" in response.data
        assert response.data["user"]["email"] == "new@example.com"

    def test_register_duplicate_email(self, client, user):
        response = client.post(
            reverse("register"),
            {"email": "test@example.com", "password": "securepass123"},
        )
        assert response.status_code == 400

    def test_register_weak_password(self, client):
        response = client.post(
            reverse("register"),
            {"email": "new@example.com", "password": "123"},
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestLoginView:
    def test_login_success(self, client, user):
        response = client.post(
            reverse("login"),
            {"email": "test@example.com", "password": "testpass123"},
        )
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_wrong_password(self, client, user):
        response = client.post(
            reverse("login"),
            {"email": "test@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401


@pytest.mark.django_db
class TestMeView:
    def test_me_authenticated(self, client, user):
        client.force_authenticate(user=user)
        response = client.get(reverse("me"))
        assert response.status_code == 200
        assert response.data["email"] == user.email

    def test_me_unauthenticated(self, client):
        response = client.get(reverse("me"))
        assert response.status_code == 401
