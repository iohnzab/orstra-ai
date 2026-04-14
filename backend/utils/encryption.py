import json
import base64
from cryptography.fernet import Fernet
from config import get_settings

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        settings = get_settings()
        key = settings.encryption_key
        if not key:
            # Generate a key for development (not secure for prod)
            key = Fernet.generate_key().decode()
        if isinstance(key, str):
            # Ensure key is proper base64
            try:
                key_bytes = key.encode() if len(key) == 44 else base64.urlsafe_b64encode(key.encode()[:32])
                _fernet = Fernet(key_bytes)
            except Exception:
                new_key = Fernet.generate_key()
                _fernet = Fernet(new_key)
        else:
            _fernet = Fernet(key)
    return _fernet


def encrypt(data: dict) -> str:
    """Encrypt a dict to a string."""
    f = _get_fernet()
    json_str = json.dumps(data)
    encrypted = f.encrypt(json_str.encode())
    return encrypted.decode()


def decrypt(token: str) -> dict:
    """Decrypt an encrypted string back to a dict."""
    f = _get_fernet()
    decrypted = f.decrypt(token.encode())
    return json.loads(decrypted.decode())
