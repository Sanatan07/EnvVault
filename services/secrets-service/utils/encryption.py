import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def encrypt(plaintext: str, key_b64: str) -> tuple[str, str]:
    """Returns (ciphertext_b64, iv_b64) using AES-256-GCM."""
    key = base64.b64decode(key_b64)
    iv = os.urandom(12)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(iv, plaintext.encode(), None)
    return base64.b64encode(ct).decode(), base64.b64encode(iv).decode()


def decrypt(ciphertext_b64: str, iv_b64: str, key_b64: str) -> str:
    """Decrypts AES-256-GCM ciphertext."""
    key = base64.b64decode(key_b64)
    iv = base64.b64decode(iv_b64)
    ct = base64.b64decode(ciphertext_b64)
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(iv, ct, None).decode()


def get_org_key(org_id: str) -> str:
    """Fetch organisation encryption key from env or AWS KMS."""
    from django.conf import settings

    env_key = f"ORG_KEY_{org_id.upper().replace('-', '_')}"
    key = os.environ.get(env_key)
    if key:
        return key

    if settings.ORG_KEY_DEFAULT:
        return settings.ORG_KEY_DEFAULT

    import hashlib
    raw = hashlib.sha256(org_id.encode()).digest()
    return base64.b64encode(raw).decode()
