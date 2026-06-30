from django.contrib import admin
from .models import BillingAccount, UsageCounter


@admin.register(BillingAccount)
class BillingAccountAdmin(admin.ModelAdmin):
    list_display = ["org_id", "plan", "stripe_customer_id", "billing_period_start"]


@admin.register(UsageCounter)
class UsageCounterAdmin(admin.ModelAdmin):
    list_display = ["org_id", "period_start", "secret_reads", "updated_at"]
