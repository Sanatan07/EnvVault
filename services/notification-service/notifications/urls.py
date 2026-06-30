from django.urls import path
from .views import NotificationSettingsView, TestWebhookView, InternalTriggerView

urlpatterns = [
    path("settings/<uuid:org_id>/", NotificationSettingsView.as_view(), name="notification-settings"),
    path("webhooks/test/", TestWebhookView.as_view(), name="webhook-test"),
    path("internal/trigger/", InternalTriggerView.as_view(), name="internal-trigger"),
]
