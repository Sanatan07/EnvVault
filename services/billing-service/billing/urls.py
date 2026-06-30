from django.urls import path
from .views import PlansView, UsageView, InternalIncrementView, CheckoutView, BillingPortalView, StripeWebhookView

urlpatterns = [
    path("plans/", PlansView.as_view(), name="billing-plans"),
    path("usage/<uuid:org_id>/", UsageView.as_view(), name="billing-usage"),
    path("checkout/", CheckoutView.as_view(), name="billing-checkout"),
    path("portal/", BillingPortalView.as_view(), name="billing-portal"),
    path("webhooks/stripe/", StripeWebhookView.as_view(), name="billing-stripe-webhook"),
    path("internal/increment/", InternalIncrementView.as_view(), name="billing-internal-increment"),
]
