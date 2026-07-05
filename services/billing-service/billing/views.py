import json

# pyrefly: ignore [missing-import]
import stripe
# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView

from .models import BillingAccount, UsageCounter
from .serializers import BillingAccountSerializer, UsageCounterSerializer, CheckoutSerializer
from .tasks import increment_read_counter

PLANS = [
    {"name": "free", "price": "$0/mo", "reads_per_month": 500, "projects": 1, "secrets": 10},
    {"name": "starter", "price": "$9/mo", "reads_per_month": 10000, "projects": 5, "secrets": None},
    {"name": "growth", "price": "$29/mo", "reads_per_month": 50000, "projects": 20, "secrets": None},
    {"name": "enterprise", "price": "Custom", "reads_per_month": None, "projects": None, "secrets": None},
]


def require_internal_token(request):
    return request.headers.get("X-Internal-Token") == settings.INTERNAL_SERVICE_TOKEN


class PlansView(APIView):
    def get(self, request):
        return Response(PLANS)


class UsageView(APIView):
    def get(self, request, org_id):
        from datetime import timedelta
        now = timezone.now()
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        account, _ = BillingAccount.objects.get_or_create(org_id=org_id)
        counter, _ = UsageCounter.objects.get_or_create(
            org_id=org_id,
            period_start=period_start,
            defaults={
                "period_end": (period_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1),
                "secret_reads": 0,
            },
        )
        return Response({
            "account": BillingAccountSerializer(account).data,
            "current_period": UsageCounterSerializer(counter).data,
        })

    def put(self, request, org_id):
        from datetime import timedelta
        account, _ = BillingAccount.objects.get_or_create(org_id=org_id)
        block_reads = request.data.get("block_reads_at_limit")
        if block_reads is not None:
            account.block_reads_at_limit = bool(block_reads)
            account.save(update_fields=["block_reads_at_limit"])
        
        now = timezone.now()
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        counter, _ = UsageCounter.objects.get_or_create(
            org_id=org_id,
            period_start=period_start,
            defaults={
                "period_end": (period_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1),
                "secret_reads": 0,
            },
        )
        return Response({
            "account": BillingAccountSerializer(account).data,
            "current_period": UsageCounterSerializer(counter).data,
        })


class InternalIncrementView(APIView):
    def post(self, request):
        if not require_internal_token(request):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        org_id = request.data.get("org_id")
        if not org_id:
            return Response({"detail": "org_id required"}, status=status.HTTP_400_BAD_REQUEST)
        increment_read_counter.delay(str(org_id))
        return Response({"status": "queued"})


class CheckoutView(APIView):
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        stripe.api_key = settings.STRIPE_SECRET_KEY
        if not stripe.api_key:
            return Response({"detail": "Stripe not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        account, _ = BillingAccount.objects.get_or_create(org_id=data["org_id"])
        if not account.stripe_customer_id:
            customer = stripe.Customer.create(metadata={"org_id": str(data["org_id"])})
            account.stripe_customer_id = customer.id
            account.save(update_fields=["stripe_customer_id"])

        plan_name = data["plan"]
        plan_prices = {
            "starter": 900,
            "growth": 2900,
            "enterprise": 9900,
        }
        price_cents = plan_prices.get(plan_name, 900)

        session = stripe.checkout.Session.create(
            customer=account.stripe_customer_id,
            mode="subscription",
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"EnvVault {plan_name.capitalize()} Plan",
                        "description": f"Metered billing subscription for EnvVault {plan_name} pack",
                    },
                    "unit_amount": price_cents,
                    "recurring": {
                        "interval": "month",
                    },
                },
                "quantity": 1,
            }],
            subscription_data={
                "metadata": {
                    "plan": plan_name,
                }
            },
            metadata={
                "plan": plan_name,
            },
            success_url=data["success_url"],
            cancel_url=data["cancel_url"],
        )
        return Response({"checkout_url": session.url})


class BillingPortalView(APIView):
    def post(self, request):
        org_id = request.data.get("org_id")
        return_url = request.data.get("return_url", "http://localhost:3000")

        account = BillingAccount.objects.get(org_id=org_id)
        if not account.stripe_customer_id:
            return Response({"detail": "No billing account."}, status=status.HTTP_404_NOT_FOUND)

        stripe.api_key = settings.STRIPE_SECRET_KEY
        session = stripe.billing_portal.Session.create(
            customer=account.stripe_customer_id,
            return_url=return_url,
        )
        return Response({"portal_url": session.url})


class StripeWebhookView(APIView):
    def post(self, request):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        except stripe.error.SignatureVerificationError:
            return Response({"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            customer_id = session.get("customer")
            subscription_id = session.get("subscription")
            plan = session.get("metadata", {}).get("plan", "starter")
            account = BillingAccount.objects.filter(stripe_customer_id=customer_id).first()
            if account:
                account.stripe_subscription_id = subscription_id or ""
                account.plan = plan
                account.save(update_fields=["stripe_subscription_id", "plan"])

        elif event["type"] == "customer.subscription.updated":
            sub = event["data"]["object"]
            account = BillingAccount.objects.filter(stripe_subscription_id=sub["id"]).first()
            if account:
                account.plan = sub.get("metadata", {}).get("plan", "starter")
                account.save(update_fields=["plan"])

        elif event["type"] == "customer.subscription.deleted":
            sub = event["data"]["object"]
            account = BillingAccount.objects.filter(stripe_subscription_id=sub["id"]).first()
            if account:
                account.plan = BillingAccount.PLAN_FREE
                account.stripe_subscription_id = ""
                account.save()

        return Response({"status": "ok"})
