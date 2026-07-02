import uuid
# pyright: ignore [reportMissingImports]
# pyrefly: ignore [missing-import]
from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='BillingAccount',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('org_id', models.UUIDField(db_index=True, unique=True)),
                ('stripe_customer_id', models.CharField(blank=True, max_length=255)),
                ('stripe_subscription_id', models.CharField(blank=True, max_length=255)),
                ('plan', models.CharField(default='free', max_length=50)),
                ('block_reads_at_limit', models.BooleanField(default=False)),
                ('billing_period_start', models.DateTimeField(null=True)),
                ('billing_period_end', models.DateTimeField(null=True)),
            ],
            options={
                'db_table': 'billing_accounts',
            },
        ),
        migrations.CreateModel(
            name='UsageCounter',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('org_id', models.UUIDField(db_index=True)),
                ('period_start', models.DateTimeField()),
                ('period_end', models.DateTimeField()),
                ('secret_reads', models.BigIntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'usage_counters',
                'unique_together': {('org_id', 'period_start')},
            },
        ),
    ]
