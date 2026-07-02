import hashlib
import secrets as secrets_module

# pyrefly: ignore [missing-import]
from rest_framework import generics, status
# pyrefly: ignore [missing-import]
from rest_framework.response import Response

from organisations.models import Project
from .models import APIToken
from .serializers import APITokenSerializer, APITokenCreateSerializer, APITokenCreatedSerializer


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class ProjectTokenListCreateView(generics.ListCreateAPIView):
    def get_queryset(self):
        return APIToken.objects.filter(project_id=self.kwargs["project_id"])

    def get_serializer_class(self):
        if self.request.method == "POST":
            return APITokenCreateSerializer
        return APITokenSerializer

    def create(self, request, *args, **kwargs):
        project = Project.objects.get(
            id=self.kwargs["project_id"],
            organisation__members__user=request.user,
        )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        raw_token = secrets_module.token_urlsafe(32)
        token_obj = APIToken.objects.create(
            project_id=project.id,
            name=serializer.validated_data["name"],
            token_hash=hash_token(raw_token),
            scopes=serializer.validated_data.get("scopes", ["read"]),
            environment=serializer.validated_data.get("environment", ""),
            expires_at=serializer.validated_data.get("expires_at"),
            created_by_id=request.user.id,
        )
        data = APITokenSerializer(token_obj).data
        data["token"] = raw_token
        return Response(data, status=status.HTTP_201_CREATED)


class ProjectTokenDestroyView(generics.DestroyAPIView):
    def get_object(self):
        return APIToken.objects.get(
            id=self.kwargs["token_id"],
            project_id=self.kwargs["project_id"],
        )


class InternalValidateAPITokenView(generics.GenericAPIView):
    """Used by other services to validate an API token."""

    # pyrefly: ignore [missing-import]
    from rest_framework.permissions import AllowAny
    permission_classes = [AllowAny]

    def post(self, request):
        # pyrefly: ignore [missing-import]
        from django.conf import settings
        # pyrefly: ignore [missing-import]
        from django.utils import timezone

        internal_token = request.headers.get("X-Internal-Token")
        if internal_token != settings.INTERNAL_SERVICE_TOKEN:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        raw_token = request.data.get("token")
        if not raw_token:
            return Response({"detail": "token required"}, status=status.HTTP_400_BAD_REQUEST)

        token_hash = hash_token(raw_token)
        try:
            token = APIToken.objects.get(token_hash=token_hash)
        except APIToken.DoesNotExist:
            return Response({"detail": "Invalid token."}, status=status.HTTP_401_UNAUTHORIZED)

        if token.is_expired():
            return Response({"detail": "Token expired."}, status=status.HTTP_401_UNAUTHORIZED)

        token.last_used_at = timezone.now()
        token.save(update_fields=["last_used_at"])

        data = APITokenSerializer(token).data
        from organisations.models import Project
        project = Project.objects.filter(id=token.project_id).first()
        if project:
            data["org_id"] = str(project.organisation_id)
        return Response(data)
