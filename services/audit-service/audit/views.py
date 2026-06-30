import csv
import io

from django.conf import settings
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditEvent
from .serializers import AuditEventSerializer, AuditEventIngestSerializer


def require_internal_token(request):
    return request.headers.get("X-Internal-Token") == settings.INTERNAL_SERVICE_TOKEN


class AuditEventListCreateView(generics.ListCreateAPIView):
    serializer_class = AuditEventSerializer

    def get_queryset(self):
        qs = AuditEvent.objects.all()
        params = self.request.query_params
        if project_id := params.get("project_id"):
            qs = qs.filter(project_id=project_id)
        if org_id := params.get("org_id"):
            qs = qs.filter(org_id=org_id)
        if env := params.get("env"):
            qs = qs.filter(environment_name=env)
        if actor_id := params.get("actor_id"):
            qs = qs.filter(actor_id=actor_id)
        if action := params.get("action"):
            qs = qs.filter(action=action)
        if from_dt := params.get("from"):
            qs = qs.filter(created_at__gte=from_dt)
        if to_dt := params.get("to"):
            qs = qs.filter(created_at__lte=to_dt)
        return qs

    def create(self, request, *args, **kwargs):
        if not require_internal_token(request):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        serializer = AuditEventIngestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        return Response(AuditEventSerializer(event).data, status=status.HTTP_201_CREATED)


class AuditEventDetailView(generics.RetrieveAPIView):
    queryset = AuditEvent.objects.all()
    serializer_class = AuditEventSerializer
    lookup_field = "pk"


class AuditExportView(APIView):
    def get(self, request):
        qs = AuditEvent.objects.all()
        if org_id := request.query_params.get("org_id"):
            qs = qs.filter(org_id=org_id)
        if project_id := request.query_params.get("project_id"):
            qs = qs.filter(project_id=project_id)

        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=["id", "created_at", "actor_email", "actor_type", "action", "secret_key", "environment_name", "ip_address"],
        )
        writer.writeheader()
        for event in qs.iterator():
            writer.writerow({
                "id": str(event.id),
                "created_at": event.created_at.isoformat(),
                "actor_email": event.actor_email,
                "actor_type": event.actor_type,
                "action": event.action,
                "secret_key": event.secret_key,
                "environment_name": event.environment_name,
                "ip_address": event.ip_address or "",
            })

        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="audit-log.csv"'
        return response


class AuditStatsView(APIView):
    def get(self, request):
        from django.db.models import Count
        org_id = request.query_params.get("org_id")
        qs = AuditEvent.objects.all()
        if org_id:
            qs = qs.filter(org_id=org_id)
        stats = qs.values("action").annotate(count=Count("id")).order_by("-count")
        return Response(list(stats))
