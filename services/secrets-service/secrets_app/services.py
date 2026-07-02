import io

# pyrefly: ignore [missing-import]
import httpx
# pyrefly: ignore [missing-import]
from django.conf import settings

from .models import Environment, Secret, SecretVersion
# pyrefly: ignore [missing-import]
from utils.encryption import encrypt, decrypt, get_org_key
# pyrefly: ignore [missing-module-attribute]
from utils.exceptions import PlanLimitExceeded


class SecretService:
    @staticmethod
    def list_secrets(environment: Environment) -> list:
        return Secret.objects.filter(environment=environment, is_deleted=False).order_by("key")

    @staticmethod
    def check_billing_limit(org_id: str) -> None:
        try:
            resp = httpx.get(
                f"{settings.BILLING_SERVICE_URL}/api/v1/billing/usage/{org_id}/",
                headers={"X-Internal-Token": settings.INTERNAL_SERVICE_TOKEN},
                timeout=2,
            )
            if resp.status_code == 200:
                data = resp.json()
                account = data.get("account", {})
                current_period = data.get("current_period", {})
                block_reads_at_limit = account.get("block_reads_at_limit", False)
                reads_limit = account.get("reads_limit")
                secret_reads = current_period.get("secret_reads", 0)
                if block_reads_at_limit and reads_limit is not None and secret_reads >= reads_limit:
                    raise PlanLimitExceeded()
        except httpx.RequestError:
            pass

    @staticmethod
    def get_secret_plaintext(secret: Secret, org_id: str) -> str:
        SecretService.check_billing_limit(org_id)
        key = get_org_key(org_id)
        plaintext = decrypt(secret.encrypted_value, secret.iv, key)
        SecretService._increment_billing(org_id)
        return plaintext

    @staticmethod
    def create_secret(environment: Environment, key: str, value: str, created_by_id, org_id: str) -> Secret:
        enc_key = get_org_key(org_id)
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
        enc_key = get_org_key(org_id)
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
        enc_key = get_org_key(org_id)
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

    @staticmethod
    def compare_secrets(source_env: Environment, target_env: Environment, org_id: str) -> list:
        enc_key = get_org_key(org_id)
        source_secrets = {s.key: s for s in Secret.objects.filter(environment=source_env, is_deleted=False)}
        target_secrets = {s.key: s for s in Secret.objects.filter(environment=target_env, is_deleted=False)}
        
        all_keys = sorted(list(set(source_secrets.keys()) | set(target_secrets.keys())))
        diff = []
        for k in all_keys:
            s_sec = source_secrets.get(k)
            t_sec = target_secrets.get(k)
            if s_sec and not t_sec:
                s_val = decrypt(s_sec.encrypted_value, s_sec.iv, enc_key)
                diff.append({
                    "key": k,
                    "status": "added",
                    "source_value": s_val,
                    "target_value": None,
                })
            elif not s_sec and t_sec:
                t_val = decrypt(t_sec.encrypted_value, t_sec.iv, enc_key)
                diff.append({
                    "key": k,
                    "status": "deleted",
                    "source_value": None,
                    "target_value": t_val,
                })
            else:
                # pyrefly: ignore [missing-attribute]
                s_val = decrypt(s_sec.encrypted_value, s_sec.iv, enc_key)
                # pyrefly: ignore [missing-attribute]
                t_val = decrypt(t_sec.encrypted_value, t_sec.iv, enc_key)
                status_str = "unchanged" if s_val == t_val else "modified"
                diff.append({
                    "key": k,
                    "status": status_str,
                    "source_value": s_val,
                    "target_value": t_val,
                })
        return diff

    @staticmethod
    def promote_secrets(source_env: Environment, target_env: Environment, created_by_id, org_id: str) -> int:
        enc_key = get_org_key(org_id)
        source_secrets = Secret.objects.filter(environment=source_env, is_deleted=False)
        promoted_count = 0
        for s_sec in source_secrets:
            s_val = decrypt(s_sec.encrypted_value, s_sec.iv, enc_key)
            try:
                t_sec = Secret.objects.get(environment=target_env, key=s_sec.key, is_deleted=False)
                t_val = decrypt(t_sec.encrypted_value, t_sec.iv, enc_key)
                if s_val != t_val:
                    SecretService.update_secret(t_sec, s_val, created_by_id, org_id)
                    promoted_count += 1
            except Secret.DoesNotExist:
                t_sec_deleted = Secret.objects.filter(environment=target_env, key=s_sec.key, is_deleted=True).first()
                if t_sec_deleted:
                    t_sec_deleted.is_deleted = False
                    t_sec_deleted.save()
                    SecretService.update_secret(t_sec_deleted, s_val, created_by_id, org_id)
                else:
                    SecretService.create_secret(target_env, s_sec.key, s_val, created_by_id, org_id)
                promoted_count += 1
        return promoted_count
