from django.urls import path
from .views import ProjectTokenListCreateView, ProjectTokenDestroyView, InternalValidateAPITokenView

urlpatterns = [
    path("projects/<uuid:project_id>/tokens/", ProjectTokenListCreateView.as_view(), name="token-list"),
    path("projects/<uuid:project_id>/tokens/<uuid:token_id>/", ProjectTokenDestroyView.as_view(), name="token-destroy"),
    path("internal/validate-api-token", InternalValidateAPITokenView.as_view(), name="validate-api-token"),
]
