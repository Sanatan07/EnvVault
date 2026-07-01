import uuid
from django.db import models


class BillingAccount(models.Model):
    PLAN_FREE = "free"
    PLAN_STARTER = "starter"
    PLAN_GROWTH = "growth"
    PLAN_ENTERPRISE = "enterprise"

    PLAN_LIMITS = {
        PLAN_FREE: 500,
        PLAN_STARTER: 10000,
        PLAN_GROWTH: 50000,
        PLAN_ENTERPRISE: None,
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(unique=True, db_index=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    plan = models.CharField(max_length=50, default=PLAN_FREE)
    block_reads_at_limit = models.BooleanField(default=False)
    billing_period_start = models.DateTimeField(null=True)
    billing_period_end = models.DateTimeField(null=True)

    class Meta:
        db_table = "billing_accounts"

    def get_reads_limit(self):
        return self.PLAN_LIMITS.get(self.plan)


class UsageCounter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    secret_reads = models.BigIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "usage_counters"
        unique_together = [("org_id", "period_start")]
