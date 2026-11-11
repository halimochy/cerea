# ================================================================
# FILE: backend/ms_auth.py
# Server-side verification of Microsoft Entra ID (Azure AD) ID tokens.
#
# The browser signs in with MSAL and sends the raw ID token. We never
# trust an email typed or forwarded by the client: the token's RS256
# signature is checked against Microsoft's published signing keys,
# and audience (our client ID), issuer/tenant and expiry must match.
# ================================================================

import json
import os
import time
import urllib.request

from jose import jwt
from jose.exceptions import JWTError

MSAL_CLIENT_ID = os.getenv("MSAL_CLIENT_ID", "").strip()
MSAL_TENANT_ID = os.getenv("MSAL_TENANT_ID", "").strip()

_JWKS_TTL_SECONDS = 3600
_jwks_cache = {"keys": None, "fetched_at": 0.0}


class MicrosoftTokenError(Exception):
    """Raised when an ID token is missing, invalid, or not for this app."""


def is_configured() -> bool:
    return bool(MSAL_CLIENT_ID and MSAL_TENANT_ID)


def _jwks_url() -> str:
    return f"https://login.microsoftonline.com/{MSAL_TENANT_ID}/discovery/v2.0/keys"


def _fetch_jwks() -> list:
    with urllib.request.urlopen(_jwks_url(), timeout=10) as resp:  # noqa: S310 (fixed https URL)
        return json.load(resp)["keys"]


def _signing_key(kid: str) -> dict:
    """Return the JWK for `kid`, refreshing the cached key set once if needed (key rotation)."""
    now = time.time()
    stale = now - _jwks_cache["fetched_at"] > _JWKS_TTL_SECONDS
    for attempt in range(2):
        if _jwks_cache["keys"] is None or stale or attempt == 1:
            _jwks_cache["keys"] = _fetch_jwks()
            _jwks_cache["fetched_at"] = now
            stale = False
        for key in _jwks_cache["keys"]:
            if key.get("kid") == kid:
                return key
    raise MicrosoftTokenError("Unknown token signing key")


def verify_id_token(id_token: str) -> dict:
    """Verify a Microsoft ID token and return its claims."""
    if not is_configured():
        raise MicrosoftTokenError("Microsoft sign-in is not configured on the server")
    if not id_token:
        raise MicrosoftTokenError("Missing ID token")

    try:
        header = jwt.get_unverified_header(id_token)
    except JWTError as e:
        raise MicrosoftTokenError("Malformed ID token") from e
    if header.get("alg") != "RS256" or not header.get("kid"):
        raise MicrosoftTokenError("Unsupported token algorithm")

    try:
        claims = jwt.decode(
            id_token,
            _signing_key(header["kid"]),
            algorithms=["RS256"],
            audience=MSAL_CLIENT_ID,
            issuer=f"https://login.microsoftonline.com/{MSAL_TENANT_ID}/v2.0",
            options={"verify_at_hash": False},  # ID token only; no access token to compare
        )
    except JWTError as e:
        raise MicrosoftTokenError(f"Invalid ID token: {e}") from e

    if claims.get("tid") != MSAL_TENANT_ID:
        raise MicrosoftTokenError("Token was issued for a different tenant")
    return claims


def email_from_claims(claims: dict) -> str:
    """Pick the sign-in email from verified claims (v2 tokens use preferred_username)."""
    email = claims.get("preferred_username") or claims.get("email") or claims.get("upn") or ""
    return email.strip().lower()
