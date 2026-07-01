from rest_framework import serializers
from .models import BillingAccount, UsageCounter


class BillingAccountSerializer(serializers.ModelSerializer):
    reads_limit = serializers.SerializerMethodField()

    class Meta:
        model = BillingAccount
        fields = ["id", "org_id", "plan", "reads_limit", "block_reads_at_limit", "billing_period_start", "billing_period_end"]

    def get_reads_limit(self, obj):
        return obj.get_reads_limit()


class UsageCounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsageCounter
        fields = ["id", "org_id", "period_start", "period_end", "secret_reads", "updated_at"]


class PlanSerializer(serializers.Serializer):
    name = serializers.CharField()
    price = serializers.CharField()
    reads_per_month = serializers.IntegerField(allow_null=True)
    projects = serializers.IntegerField(allow_null=True)
    secrets = serializers.IntegerField(allow_null=True)


class CheckoutSerializer(serializers.Serializer):
    org_id = serializers.UUIDField()
    plan = serializers.ChoiceField(choices=["starter", "growth", "enterprise"])
    success_url = serializers.URLField()
    cancel_url = serializers.URLField()
