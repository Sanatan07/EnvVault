from django.urls import path
from .views import (
    EnvironmentListCreateView,
    EnvironmentDestroyView,
    SecretListCreateView,
    SecretDetailView,
    SecretVersionListView,
    SecretRollbackView,
    ImportEnvView,
    ExportEnvView,
)

urlpatterns = [
    # Environments
    path("<uuid:project_id>/environments/", EnvironmentListCreateView.as_view(), name="env-list"),
    path("<uuid:project_id>/environments/<uuid:env_id>/", EnvironmentDestroyView.as_view(), name="env-destroy"),
    # Secrets CRUD
    path("<uuid:project_id>/<str:env>/", SecretListCreateView.as_view(), name="secret-list"),
    path("<uuid:project_id>/<str:env>/<str:key>/", SecretDetailView.as_view(), name="secret-detail"),
    # Versions & rollback
    path("<uuid:project_id>/<str:env>/<str:key>/versions/", SecretVersionListView.as_view(), name="secret-versions"),
    path(
        "<uuid:project_id>/<str:env>/<str:key>/rollback/<int:version_number>/",
        SecretRollbackView.as_view(),
        name="secret-rollback",
    ),
    # Import / Export
    path("<uuid:project_id>/<str:env>/import/", ImportEnvView.as_view(), name="secret-import"),
    path("<uuid:project_id>/<str:env>/export/", ExportEnvView.as_view(), name="secret-export"),
]
