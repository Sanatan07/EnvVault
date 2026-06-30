from celery import shared_task
from django.utils import timezone
from datetime import timedelta


@shared_task
def increment_read_counter(org_id: str, count: int = 1):
    from .models import UsageCounter, BillingAccount
    now = timezone.now()
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)

    counter, _ = UsageCounter.objects.get_or_create(
        org_id=org_id,
        period_start=period_start,
        defaults={"period_end": period_end, "secret_reads": 0},
    )
    UsageCounter.objects.filter(id=counter.id).update(
        secret_reads=counter.secret_reads + count
    )

    try:
        account = BillingAccount.objects.get(org_id=org_id)
        limit = account.get_reads_limit()
        if limit and (counter.secret_reads + count) >= limit:
            pass  # TODO: trigger overage notification
    except BillingAccount.DoesNotExist:
        pass


@shared_task
def sync_usage_to_stripe():
    """Called by Celery Beat at period end to report usage to Stripe."""
    import stripe
    from django.conf import settings
    from .models import BillingAccount, UsageCounter

    if not settings.STRIPE_METER_ID:
        return

    stripe.api_key = settings.STRIPE_SECRET_KEY
    now = timezone.now()
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    for counter in UsageCounter.objects.filter(period_start=period_start, secret_reads__gt=0):
        try:
            account = BillingAccount.objects.get(org_id=counter.org_id)
            if not account.stripe_customer_id:
                continue
            stripe.billing.MeterEvent.create(
                event_name=settings.STRIPE_METER_ID,
                payload={"stripe_customer_id": account.stripe_customer_id, "value": str(counter.secret_reads)},
            )
        except Exception:
            pass
