import hashlib

import httpx
from django.conf import settings
from django.core.cache import cache
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class AuthenticatedUser:
    """Minimal user-like object returned from token validation."""

    def __init__(self, data: dict):
        self.id = data.get("id")
        self.email = data.get("email")
        self.org_id = data.get("org_id")
        self.role = data.get("role")
        self.token_data = data
        self.is_authenticated = True
        self.is_api_token = data.get("is_api_token", False)


class ServiceAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header:
            return None

        scheme, _, credential = auth_header.partition(" ")
        if not credential:
            return None

        cache_key = f"auth:{hashlib.sha256(credential.encode()).hexdigest()}"
        cached = cache.get(cache_key)
        if cached:
            return AuthenticatedUser(cached), None

        if scheme == "Bearer":
            user_data = self._validate_jwt(credential)
        elif scheme == "Token":
            user_data = self._validate_api_token(credential)
        else:
            return None

        cache.set(cache_key, user_data, 60)
        return AuthenticatedUser(user_data), None

    def _validate_jwt(self, token: str) -> dict:
        try:
            resp = httpx.post(
                f"{settings.AUTH_SERVICE_URL}/api/v1/auth/internal/validate-token",
                json={"token": token},
                headers={"X-Internal-Token": settings.INTERNAL_SERVICE_TOKEN},
                timeout=5,
            )
            if resp.status_code != 200:
                raise AuthenticationFailed("Invalid JWT token.")
            return resp.json()
        except httpx.RequestError:
            raise AuthenticationFailed("Auth service unavailable.")

    def _validate_api_token(self, token: str) -> dict:
        try:
            resp = httpx.post(
                f"{settings.AUTH_SERVICE_URL}/api/v1/auth/internal/validate-api-token",
                json={"token": token},
                headers={"X-Internal-Token": settings.INTERNAL_SERVICE_TOKEN},
                timeout=5,
            )
            if resp.status_code != 200:
                raise AuthenticationFailed("Invalid API token.")
            data = resp.json()
            data["is_api_token"] = True
            return data
        except httpx.RequestError:
            raise AuthenticationFailed("Auth service unavailable.")
