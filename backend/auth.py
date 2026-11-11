# ============================================================
# auth.py — JWT & Password Hashing
# Menggunakan bcrypt langsung (tanpa passlib) agar kompatibel
# dengan bcrypt 4.x yang terbaru
# ============================================================

import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv
import os

load_dotenv()

# ── Konfigurasi ──────────────────────────────────────────────
SECRET_KEY           = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET is not set. Copy backend/.env.example to backend/.env and set a long random value "
        "(python -c \"import secrets; print(secrets.token_hex(32))\")."
    )
ALGORITHM            = "HS256"
TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "480"))


# ── BCrypt: Hash & Verify Password ──────────────────────────

def hash_password(password_plaintext: str) -> str:
    """
    Hash password dengan BCrypt.
    Return string hash yang aman untuk disimpan di database.
    """
    password_bytes = password_plaintext.encode("utf-8")
    salt           = bcrypt.gensalt()
    hashed         = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password_plaintext: str, hashed_password: str) -> bool:
    """
    Bandingkan password plaintext dengan hash tersimpan.
    Return True jika cocok, False jika tidak.
    """
    try:
        password_bytes = password_plaintext.encode("utf-8")
        hashed_bytes   = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


# ── JWT: Buat & Decode Token ─────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Buat JWT access token.
    `data` minimal harus berisi: {"sub": nik, "role": role}
    """
    to_encode = data.copy()
    expire    = datetime.utcnow() + (expires_delta or timedelta(minutes=TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """
    Decode & verifikasi JWT token.
    Return payload dict jika valid, None jika invalid/expired.
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None