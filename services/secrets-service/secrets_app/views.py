# pyrefly: ignore [missing-import]
from django.http import HttpResponse, Http404
# pyrefly: ignore [missing-import]
from rest_framework import generics, status
# pyrefly: ignore [missing-import]
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView

from .models import Environment, Secret, SecretVersion
from .serializers import (
    EnvironmentSerializer,
    EnvironmentCreateSerializer,
    SecretSerializer,
    SecretDetailSerializer,
    SecretCreateSerializer,
    SecretUpdateSerializer,
    SecretVersionSerializer,
)
from .services import SecretService


def get_environment_or_initialize(project_id, name, user):
    try:
        return Environment.objects.get(project_id=project_id, name=name)
    except Environment.DoesNotExist:
        if not Environment.objects.filter(project_id=project_id).exists():
            org_id = getattr(user, "org_id", None)
            if org_id:
                Environment.objects.create(project_id=project_id, org_id=org_id, name="production", color="#ef4444")
                Environment.objects.create(project_id=project_id, org_id=org_id, name="staging", color="#f59e0b")
                Environment.objects.create(project_id=project_id, org_id=org_id, name="development", color="#10b981")
                try:
                    return Environment.objects.get(project_id=project_id, name=name)
                except Environment.DoesNotExist:
                    pass
        raise Http404("Environment matching query does not exist.")


class EnvironmentListCreateView(generics.ListCreateAPIView):
    def get_queryset(self):
        project_id = self.kwargs["project_id"]
        qs = Environment.objects.filter(project_id=project_id)
        if not qs.exists():
            org_id = getattr(self.request.user, "org_id", None)
            if not org_id:
                org_id = self.request.query_params.get("org_id") or self.request.data.get("org_id")
            if org_id:
                Environment.objects.create(project_id=project_id, org_id=org_id, name="production", color="#ef4444")
                Environment.objects.create(project_id=project_id, org_id=org_id, name="staging", color="#f59e0b")
                Environment.objects.create(project_id=project_id, org_id=org_id, name="development", color="#10b981")
                qs = Environment.objects.filter(project_id=project_id)
        return qs

    def get_serializer_class(self):
        return EnvironmentCreateSerializer if self.request.method == "POST" else EnvironmentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        env = Environment.objects.create(
            project_id=self.kwargs["project_id"],
            org_id=request.user.org_id or request.data.get("org_id"),
            **serializer.validated_data,
        )
        return Response(EnvironmentSerializer(env).data, status=status.HTTP_201_CREATED)


class EnvironmentDestroyView(generics.DestroyAPIView):
    def get_object(self):
        return Environment.objects.get(id=self.kwargs["env_id"], project_id=self.kwargs["project_id"])


class SecretListCreateView(APIView):
    def get(self, request, project_id, env):
        environment = get_environment_or_initialize(project_id, env, request.user)
        secrets = SecretService.list_secrets(environment)
        return Response(SecretSerializer(secrets, many=True).data)

    def post(self, request, project_id, env):
        environment = get_environment_or_initialize(project_id, env, request.user)
        serializer = SecretCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if Secret.objects.filter(
            environment=environment, key=serializer.validated_data["key"], is_deleted=False
        ).exists():
            return Response({"error": "Key already exists."}, status=status.HTTP_409_CONFLICT)

        org_id = str(environment.org_id)
        secret = SecretService.create_secret(
            environment=environment,
            key=serializer.validated_data["key"],
            value=serializer.validated_data["value"],
            created_by_id=request.user.id,
            org_id=org_id,
        )
        SecretService.emit_audit({
            "org_id": org_id,
            "project_id": str(project_id),
            "environment_name": env,
            "actor_type": "api_token" if request.user.is_api_token else "member",
            "actor_id": str(request.user.id),
            "actor_email": request.user.email,
            "secret_key": secret.key,
            "action": "write",
            "ip_address": request.META.get("REMOTE_ADDR"),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        })
        return Response(SecretSerializer(secret).data, status=status.HTTP_201_CREATED)


class SecretDetailView(APIView):
    def get(self, request, project_id, env, key):
        environment = get_environment_or_initialize(project_id, env, request.user)
        secret = Secret.objects.get(environment=environment, key=key, is_deleted=False)
        org_id = str(environment.org_id)
        value = SecretService.get_secret_plaintext(secret, org_id)

        SecretService.emit_audit({
            "org_id": org_id,
            "project_id": str(project_id),
            "environment_name": env,
            "actor_type": "api_token" if request.user.is_api_token else "member",
            "actor_id": str(request.user.id),
            "actor_email": request.user.email,
            "secret_key": key,
            "action": "read",
            "ip_address": request.META.get("REMOTE_ADDR"),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        })
        data = SecretDetailSerializer(secret).data
        data["value"] = value
        return Response(data)

    def put(self, request, project_id, env, key):
        environment = get_environment_or_initialize(project_id, env, request.user)
        secret = Secret.objects.get(environment=environment, key=key, is_deleted=False)
        serializer = SecretUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        org_id = str(environment.org_id)
        secret = SecretService.update_secret(secret, serializer.validated_data["value"], request.user.id, org_id)

        SecretService.emit_audit({
            "org_id": org_id,
            "project_id": str(project_id),
            "environment_name": env,
            "actor_type": "api_token" if request.user.is_api_token else "member",
            "actor_id": str(request.user.id),
            "actor_email": request.user.email,
            "secret_key": key,
            "action": "write",
            "ip_address": request.META.get("REMOTE_ADDR"),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        })
        return Response(SecretSerializer(secret).data)

    def delete(self, request, project_id, env, key):
        environment = get_environment_or_initialize(project_id, env, request.user)
        secret = Secret.objects.get(environment=environment, key=key, is_deleted=False)
        org_id = str(environment.org_id)
        SecretService.delete_secret(secret)

        SecretService.emit_audit({
            "org_id": org_id,
            "project_id": str(project_id),
            "environment_name": env,
            "actor_type": "api_token" if request.user.is_api_token else "member",
            "actor_id": str(request.user.id),
            "actor_email": request.user.email,
            "secret_key": key,
            "action": "delete",
            "ip_address": request.META.get("REMOTE_ADDR"),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        })
        return Response(status=status.HTTP_204_NO_CONTENT)


class SecretVersionListView(generics.ListAPIView):
    serializer_class = SecretVersionSerializer

    def get_queryset(self):
        environment = get_environment_or_initialize(
            self.kwargs["project_id"], self.kwargs["env"], self.request.user
        )
        secret = Secret.objects.get(environment=environment, key=self.kwargs["key"])
        return SecretVersion.objects.filter(secret=secret)


class SecretRollbackView(APIView):
    def post(self, request, project_id, env, key, version_number):
        environment = get_environment_or_initialize(project_id, env, request.user)
        secret = Secret.objects.get(environment=environment, key=key, is_deleted=False)
        org_id = str(environment.org_id)
        secret = SecretService.rollback_secret(secret, version_number, request.user.id, org_id)

        SecretService.emit_audit({
            "org_id": org_id,
            "project_id": str(project_id),
            "environment_name": env,
            "actor_type": "api_token" if request.user.is_api_token else "member",
            "actor_id": str(request.user.id),
            "actor_email": request.user.email,
            "secret_key": key,
            "action": "rollback",
            "ip_address": request.META.get("REMOTE_ADDR"),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
            "metadata": {"rolled_back_to_version": version_number},
        })
        return Response(SecretSerializer(secret).data)


class ImportEnvView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, project_id, env):
        environment = get_environment_or_initialize(project_id, env, request.user)
        org_id = str(environment.org_id)

        if "file" in request.FILES:
            content = request.FILES["file"].read().decode("utf-8")
        elif "content" in request.data:
            content = request.data["content"]
        else:
            return Response({"error": "Provide a file or content."}, status=status.HTTP_400_BAD_REQUEST)

        count = SecretService.import_env_file(environment, content, request.user.id, org_id)
        SecretService.emit_audit({
            "org_id": org_id,
            "project_id": str(project_id),
            "environment_name": env,
            "actor_type": "api_token" if request.user.is_api_token else "member",
            "actor_id": str(request.user.id),
            "actor_email": request.user.email,
            "action": "import",
            "ip_address": request.META.get("REMOTE_ADDR"),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
            "metadata": {"count": count},
        })
        return Response({"imported": count})


class ExportEnvView(APIView):
    def get(self, request, project_id, env):
        environment = get_environment_or_initialize(project_id, env, request.user)
        org_id = str(environment.org_id)
        content = SecretService.export_env_file(environment, org_id)

        SecretService.emit_audit({
            "org_id": org_id,
            "project_id": str(project_id),
            "environment_name": env,
            "actor_type": "api_token" if request.user.is_api_token else "member",
            "actor_id": str(request.user.id),
            "actor_email": request.user.email,
            "action": "export",
            "ip_address": request.META.get("REMOTE_ADDR"),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        })
        response = HttpResponse(content, content_type="text/plain")
        response["Content-Disposition"] = f'attachment; filename="{env}.env"'
        return response


class SecretPromoteView(APIView):
    def get(self, request, project_id):
        source_name = request.query_params.get("source_env")
        target_name = request.query_params.get("target_env")
        if not source_name or not target_name:
            return Response({"error": "source_env and target_env query parameters are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            source_env = Environment.objects.get(project_id=project_id, name=source_name)
            target_env = Environment.objects.get(project_id=project_id, name=target_name)
        except Environment.DoesNotExist:
            return Response({"error": "Source or target environment not found."}, status=status.HTTP_404_NOT_FOUND)
        
        diff = SecretService.compare_secrets(source_env, target_env, str(source_env.org_id))
        return Response(diff)

    def post(self, request, project_id):
        source_name = request.data.get("source_env")
        target_name = request.data.get("target_env")
        if not source_name or not target_name:
            return Response({"error": "source_env and target_env are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            source_env = Environment.objects.get(project_id=project_id, name=source_name)
            target_env = Environment.objects.get(project_id=project_id, name=target_name)
        except Environment.DoesNotExist:
            return Response({"error": "Source or target environment not found."}, status=status.HTTP_404_NOT_FOUND)
        
        org_id = str(source_env.org_id)
        count = SecretService.promote_secrets(source_env, target_env, request.user.id, org_id)
        
        SecretService.emit_audit({
            "org_id": org_id,
            "project_id": str(project_id),
            "environment_name": target_name,
            "actor_type": "api_token" if request.user.is_api_token else "member",
            "actor_id": str(request.user.id),
            "actor_email": request.user.email,
            "action": "write",
            "ip_address": request.META.get("REMOTE_ADDR"),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
            "metadata": {"source_env": source_name, "promoted_count": count},
        })
        return Response({"promoted": count})
