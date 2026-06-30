from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NotificationSettings
from .serializers import NotificationSettingsSerializer
from .tasks import deliver_webhook


def require_internal(request):
    return request.headers.get("X-Internal-Token") == settings.INTERNAL_SERVICE_TOKEN


class NotificationSettingsView(APIView):
    def get(self, request, org_id):
        obj, _ = NotificationSettings.objects.get_or_create(org_id=org_id)
        return Response(NotificationSettingsSerializer(obj).data)

    def put(self, request, org_id):
        obj, _ = NotificationSettings.objects.get_or_create(org_id=org_id)
        serializer = NotificationSettingsSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TestWebhookView(APIView):
    def post(self, request):
        url = request.data.get("url")
        if not url:
            return Response({"detail": "url required"}, status=status.HTTP_400_BAD_REQUEST)
        deliver_webhook.delay(url, {"event": "test", "message": "EnvVault webhook test"})
        return Response({"detail": "Test webhook queued."})


class InternalTriggerView(APIView):
    def post(self, request):
        if not require_internal(request):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        event_type = request.data.get("event")
        payload = request.data.get("payload", {})

        if event_type == "secret_change":
            from .tasks import send_secret_change_alert
            send_secret_change_alert.delay(**payload)
        elif event_type == "new_ip":
            from .tasks import send_new_ip_alert
            send_new_ip_alert.delay(**payload)
        elif event_type == "expiry_reminder":
            from .tasks import send_expiry_reminder
            send_expiry_reminder.delay(**payload)
        elif event_type == "invoice":
            from .tasks import send_invoice_email
            send_invoice_email.delay(**payload)
        else:
            return Response({"detail": "Unknown event type."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"status": "queued"})
