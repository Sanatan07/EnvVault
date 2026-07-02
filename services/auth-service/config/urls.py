# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from django.urls import include, path
# pyrefly: ignore [missing-import]
from django.http import JsonResponse
from organisations.views import ProjectListCreateView, ProjectDetailView


def health(request):
    return JsonResponse({"status": "ok", "service": "auth-service"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/v1/auth/", include("users.urls")),
    path("api/v1/auth/organisations/", include("organisations.urls")),
    path("api/v1/auth/projects", ProjectListCreateView.as_view(), name="project-list"),
    path("api/v1/auth/projects/<uuid:project_id>", ProjectDetailView.as_view(), name="project-detail"),
    path("api/v1/auth/", include("tokens.urls")),
]
