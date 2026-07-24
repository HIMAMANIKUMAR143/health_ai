import logging
import json
import base64
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try importing passlib, otherwise use hashlib fallback
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    _has_passlib = True
except Exception:
    _has_passlib = False

# Try importing jwt / jose, otherwise use standard library fallback
_has_jwt = False
try:
    import jwt
    _has_jwt = True
except Exception:
    try:
        from jose import jwt
        _has_jwt = True
    except Exception:
        _has_jwt = False

def hash_password(password: str) -> str:
    """Hash a password using bcrypt or PBKDF2 fallback."""
    if _has_passlib:
        try:
            return pwd_context.hash(password)
        except Exception:
            pass
    salt = hashlib.sha256(settings.JWT_SECRET.encode()).digest()
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"pbkdf2:{key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    if not hashed_password:
        return False
    if _has_passlib and not hashed_password.startswith("pbkdf2:"):
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass
    expected = hash_password(plain_password)
    return hmac.compare_digest(expected, hashed_password)

def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _b64decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": int(expire.timestamp())})

    if _has_jwt:
        try:
            return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        except Exception as e:
            logger.warning(f"PyJWT encode failed, using fallback: {e}")

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _b64encode(json.dumps(header).encode('utf-8'))
    payload_b64 = _b64encode(json.dumps(to_encode).encode('utf-8'))
    signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    sig = hmac.new(settings.JWT_SECRET.encode('utf-8'), signature_input, hashlib.sha256).digest()
    sig_b64 = _b64encode(sig)

    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_token(token: str) -> Optional[dict]:
    """Decode JWT token."""
    if _has_jwt:
        try:
            return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except Exception:
            pass

    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(settings.JWT_SECRET.encode('utf-8'), signature_input, hashlib.sha256).digest()
        actual_sig = _b64decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _b64decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))

        if "exp" in payload and datetime.utcnow().timestamp() > payload["exp"]:
            return None
        return payload
    except Exception as e:
        logger.error(f"Decode token error: {e}")
        return None

