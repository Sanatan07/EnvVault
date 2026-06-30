from celery import shared_task


@shared_task
def send_secret_change_alert(org_id: str, project_id: str, secret_key: str, action: str, actor_email: str):
    from .models import NotificationSettings
    try:
        settings_obj = NotificationSettings.objects.get(org_id=org_id)
    except NotificationSettings.DoesNotExist:
        return

    message = f"[EnvVault] Secret `{secret_key}` was {action} by {actor_email}"

    if settings_obj.slack_webhook_url and getattr(settings_obj, f"notify_on_{action}", False):
        _send_slack(settings_obj.slack_webhook_url, message)

    if settings_obj.custom_webhook_url:
        _deliver_webhook(settings_obj.custom_webhook_url, {
            "event": "secret_change",
            "org_id": org_id,
            "project_id": project_id,
            "secret_key": secret_key,
            "action": action,
            "actor": actor_email,
        })


@shared_task
def send_new_ip_alert(org_id: str, actor_email: str, ip_address: str):
    from .models import NotificationSettings
    try:
        settings_obj = NotificationSettings.objects.get(org_id=org_id)
    except NotificationSettings.DoesNotExist:
        return

    if settings_obj.notify_on_new_ip and settings_obj.slack_webhook_url:
        message = f"[EnvVault] Access from new IP {ip_address} by {actor_email}"
        _send_slack(settings_obj.slack_webhook_url, message)


@shared_task
def send_expiry_reminder(org_id: str, secret_key: str, days_until_expiry: int, owner_email: str):
    from django.conf import settings as django_settings
    _send_email(
        to_email=owner_email,
        subject=f"[EnvVault] Secret rotation reminder: {secret_key}",
        body=f"The secret {secret_key} in your organisation has not been rotated in a while.\n"
             f"It will expire in {days_until_expiry} days. Please rotate it soon.",
    )


@shared_task
def deliver_webhook(url: str, payload: dict):
    _deliver_webhook(url, payload)


@shared_task
def send_invoice_email(to_email: str, org_name: str, amount: str, period: str):
    _send_email(
        to_email=to_email,
        subject=f"[EnvVault] Invoice for {org_name} — {period}",
        body=f"Your EnvVault invoice for {period} is {amount}. Thank you for using EnvVault.",
    )


def _send_slack(webhook_url: str, message: str):
    import httpx
    try:
        httpx.post(webhook_url, json={"text": message}, timeout=5)
    except Exception:
        pass


def _deliver_webhook(url: str, payload: dict):
    import httpx
    try:
        httpx.post(url, json=payload, timeout=5)
    except Exception:
        pass


def _send_email(to_email: str, subject: str, body: str):
    from django.conf import settings as django_settings
    if not django_settings.SENDGRID_API_KEY:
        return
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail
        sg = sendgrid.SendGridAPIClient(api_key=django_settings.SENDGRID_API_KEY)
        message = Mail(
            from_email=django_settings.FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            plain_text_content=body,
        )
        sg.send(message)
    except Exception:
        pass
