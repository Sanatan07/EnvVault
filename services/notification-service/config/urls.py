from django.urls import include, path
from django.http import JsonResponse


def health(request):
    return JsonResponse({"status": "ok", "service": "notification-service"})


urlpatterns = [
    path("health/", health),
    path("api/v1/notifications/", include("notifications.urls")),
]
