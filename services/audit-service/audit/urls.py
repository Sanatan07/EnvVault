from django.urls import path
from .views import AuditEventListCreateView, AuditEventDetailView, AuditExportView, AuditStatsView

urlpatterns = [
    path("events/", AuditEventListCreateView.as_view(), name="audit-events"),
    path("events/<uuid:pk>/", AuditEventDetailView.as_view(), name="audit-event-detail"),
    path("events/export/", AuditExportView.as_view(), name="audit-export"),
    path("stats/", AuditStatsView.as_view(), name="audit-stats"),
]
