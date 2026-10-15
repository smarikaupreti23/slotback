from fastapi import APIRouter, Depends, HTTPException

from ..auth import CurrentUser, current_user, user_from_supabase
from ..db import get_db, new_client
from ..schemas import LoginIn, RegisterIn

router = APIRouter(prefix="/auth", tags=["auth"])


def _session_payload(session, user) -> dict:
    u = user_from_supabase(user)
    return {
        "access_token": session.access_token,
        "user": {"id": u.id, "email": u.email, "full_name": u.full_name},
    }


@router.post("/login")
def login(body: LoginIn):
    try:
        res = new_client().auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception:
        raise HTTPException(401, "Incorrect email or password")
    if not res.session or not res.user:
        raise HTTPException(401, "Incorrect email or password")
    return _session_payload(res.session, res.user)


@router.post("/register", status_code=201)
def register(body: RegisterIn):
    """Creates a coordinator account in Supabase Auth, then signs them in."""
    try:
        get_db().auth.admin.create_user(
            {
                "email": body.email,
                "password": body.password,
                "email_confirm": True,
                "user_metadata": {"full_name": body.full_name.strip()},
            }
        )
    except Exception as exc:
        msg = str(exc).lower()
        if "already" in msg or "registered" in msg or "exists" in msg:
            raise HTTPException(409, "An account with this email already exists")
        raise HTTPException(400, "Could not create account")
    return login(LoginIn(email=body.email, password=body.password))


@router.get("/me")
def me(user: CurrentUser = Depends(current_user)):
    return {"id": user.id, "email": user.email, "full_name": user.full_name}
