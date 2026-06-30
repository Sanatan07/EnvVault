import io

import httpx
from django.conf import settings

from .models import Environment, Secret, SecretVersion
from utils.encryption import encrypt, decrypt, get_org_key
from utils.exceptions import PlanLimitExceeded


class SecretService:
    @staticmethod
    def list_secrets(environment: Environment) -> list:
        return Secret.objects.filter(environment=environment, is_deleted=False).order_by("key")

    @staticmethod
    def get_secret_plaintext(secret: Secret, org_id: str) -> str:
        key = get_org_key(str(org_id))
        plaintext = decrypt(secret.encrypted_value, secret.iv, key)
        SecretService._increment_billing(str(org_id))
        return plaintext

    @staticmethod
    def create_secret(environment: Environment, key: str, value: str, created_by_id, org_id: str) -> Secret:
        enc_key = get_org_key(str(org_id))
        encrypted_value, iv = encrypt(value, enc_key)
        secret = Secret.objects.create(
            environment=environment,
            key=key,
            encrypted_value=encrypted_value,
            iv=iv,
            created_by_id=created_by_id,
        )
        SecretVersion.objects.create(
            secret=secret,
            encrypted_value=encrypted_value,
            iv=iv,
            version_number=1,
            created_by_id=created_by_id,
        )
        return secret

    @staticmethod
    def update_secret(secret: Secret, value: str, updated_by_id, org_id: str) -> Secret:
        enc_key = get_org_key(str(org_id))
        encrypted_value, iv = encrypt(value, enc_key)
        secret.current_version += 1
        secret.encrypted_value = encrypted_value
        secret.iv = iv
        secret.save()
        SecretVersion.objects.create(
            secret=secret,
            encrypted_value=encrypted_value,
            iv=iv,
            version_number=secret.current_version,
            created_by_id=updated_by_id,
        )
        return secret

    @staticmethod
    def delete_secret(secret: Secret) -> None:
        secret.is_deleted = True
        secret.save(update_fields=["is_deleted"])

    @staticmethod
    def rollback_secret(secret: Secret, version_number: int, rolled_back_by_id, org_id: str) -> Secret:
        version = SecretVersion.objects.get(secret=secret, version_number=version_number)
        secret.current_version += 1
        secret.encrypted_value = version.encrypted_value
        secret.iv = version.iv
        secret.save()
        SecretVersion.objects.create(
            secret=secret,
            encrypted_value=version.encrypted_value,
            iv=version.iv,
            version_number=secret.current_version,
            created_by_id=rolled_back_by_id,
        )
        return secret

    @staticmethod
    def import_env_file(environment: Environment, content: str, created_by_id, org_id: str) -> int:
        count = 0
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if not key:
                continue
            try:
                secret = Secret.objects.get(environment=environment, key=key, is_deleted=False)
                SecretService.update_secret(secret, value, created_by_id, org_id)
            except Secret.DoesNotExist:
                SecretService.create_secret(environment, key, value, created_by_id, org_id)
            count += 1
        return count

    @staticmethod
    def export_env_file(environment: Environment, org_id: str) -> str:
        secrets = SecretService.list_secrets(environment)
        enc_key = get_org_key(str(org_id))
        lines = [f"# EnvVault export — {environment.name}\n"]
        for secret in secrets:
            value = decrypt(secret.encrypted_value, secret.iv, enc_key)
            lines.append(f"{secret.key}={value}\n")
        return "".join(lines)

    @staticmethod
    def _increment_billing(org_id: str) -> None:
        try:
            httpx.post(
                f"{settings.BILLING_SERVICE_URL}/api/v1/billing/internal/increment/",
                json={"org_id": org_id},
                headers={"X-Internal-Token": settings.INTERNAL_SERVICE_TOKEN},
                timeout=2,
            )
        except Exception:
            pass

    @staticmethod
    def emit_audit(event: dict) -> None:
        try:
            httpx.post(
                f"{settings.AUDIT_SERVICE_URL}/api/v1/audit/events/",
                json=event,
                headers={"X-Internal-Token": settings.INTERNAL_SERVICE_TOKEN},
                timeout=2,
            )
        except Exception:
            pass
