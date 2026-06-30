from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse


def health(request):
    return JsonResponse({"status": "ok", "service": "billing-service"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/v1/billing/", include("billing.urls")),
]
