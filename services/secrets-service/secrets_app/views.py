from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
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


class EnvironmentListCreateView(generics.ListCreateAPIView):
    def get_queryset(self):
        return Environment.objects.filter(project_id=self.kwargs["project_id"])

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
        environment = Environment.objects.get(project_id=project_id, name=env)
        secrets = SecretService.list_secrets(environment)
        return Response(SecretSerializer(secrets, many=True).data)

    def post(self, request, project_id, env):
        environment = Environment.objects.get(project_id=project_id, name=env)
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
        environment = Environment.objects.get(project_id=project_id, name=env)
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
        environment = Environment.objects.get(project_id=project_id, name=env)
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
        environment = Environment.objects.get(project_id=project_id, name=env)
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
        environment = Environment.objects.get(project_id=self.kwargs["project_id"], name=self.kwargs["env"])
        secret = Secret.objects.get(environment=environment, key=self.kwargs["key"])
        return SecretVersion.objects.filter(secret=secret)


class SecretRollbackView(APIView):
    def post(self, request, project_id, env, key, version_number):
        environment = Environment.objects.get(project_id=project_id, name=env)
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
        environment = Environment.objects.get(project_id=project_id, name=env)
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
        environment = Environment.objects.get(project_id=project_id, name=env)
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
