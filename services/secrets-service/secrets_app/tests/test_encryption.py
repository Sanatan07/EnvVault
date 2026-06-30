import base64
import os
import pytest
from utils.encryption import encrypt, decrypt


@pytest.fixture
def key_b64():
    return base64.b64encode(os.urandom(32)).decode()


def test_encrypt_decrypt_roundtrip(key_b64):
    plaintext = "my-super-secret-value"
    ciphertext, iv = encrypt(plaintext, key_b64)
    assert ciphertext != plaintext
    result = decrypt(ciphertext, iv, key_b64)
    assert result == plaintext


def test_encrypt_produces_unique_iv(key_b64):
    _, iv1 = encrypt("value", key_b64)
    _, iv2 = encrypt("value", key_b64)
    assert iv1 != iv2


def test_decrypt_wrong_key_raises(key_b64):
    ciphertext, iv = encrypt("secret", key_b64)
    wrong_key = base64.b64encode(os.urandom(32)).decode()
    with pytest.raises(Exception):
        decrypt(ciphertext, iv, wrong_key)
