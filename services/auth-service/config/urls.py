from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse


def health(request):
    return JsonResponse({"status": "ok", "service": "auth-service"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/v1/auth/", include("users.urls")),
    path("api/v1/auth/organisations/", include("organisations.urls")),
    path("api/v1/auth/", include("tokens.urls")),
]
