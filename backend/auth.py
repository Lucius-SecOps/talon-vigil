"""
Auth Dependency — Supabase JWT Verification
Verifies the Bearer token issued by Supabase Auth and returns the
authenticated user's UUID (the `sub` claim).

Import `get_current_user` and use it as a FastAPI Depends() to gate any
route that requires an authenticated caller.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt as pyjwt
from jwt.exceptions import InvalidTokenError

from config import get_settings

settings = get_settings()

_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """
    Decode and verify the Supabase JWT.
    Returns the user UUID on success.
    Raises HTTP 401 on any failure — never leaks validation detail to the caller.
    """
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = pyjwt.decode(
            credentials.credentials,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise exc
        return user_id
    except InvalidTokenError:
        raise exc
