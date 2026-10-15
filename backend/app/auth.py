from dataclasses import dataclass

from fastapi import Header, HTTPException

from .db import get_db


@dataclass
class CurrentUser:
    id: str
    email: str
    full_name: str


def user_from_supabase(user) -> CurrentUser:
    meta = getattr(user, "user_metadata", None) or {}
    email = user.email or ""
    return CurrentUser(
        id=str(user.id),
        email=email,
        full_name=meta.get("full_name") or email.split("@")[0],
    )


def current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    """Dependency: validates the Supabase access token sent by the frontend."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ", 1)[1].strip()
    try:
        res = get_db().auth.get_user(token)
        user = res.user if res else None
    except Exception:
        user = None
    if not user:
        raise HTTPException(401, "Session expired - please sign in again")
    return user_from_supabase(user)
