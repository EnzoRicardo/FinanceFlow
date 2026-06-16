import os

from fastapi import Depends, Header, HTTPException
from firebase_admin import auth as firebase_auth

from app.core.firebase import get_db
from app.schemas.user import CurrentUser, UserRole


def _admin_emails() -> set[str]:
    raw = os.getenv("ADMIN_EMAILS", "")
    return {email.strip().lower() for email in raw.split(",") if email.strip()}


def resolve_user_role(email: str, stored_role: str | None) -> UserRole:
    if stored_role == UserRole.ADMIN.value:
        return UserRole.ADMIN
    if email.lower() in _admin_emails():
        return UserRole.ADMIN
    return UserRole.USER


def get_bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token não informado.")
    return authorization.split(" ", 1)[1]


def get_current_user(
    token: str = Depends(get_bearer_token),
    db=Depends(get_db),
) -> CurrentUser:
    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")

    uid = decoded["uid"]
    email = decoded.get("email", "")
    name = decoded.get("name") or decoded.get("display_name")

    doc = db.collection("users").document(uid).get()
    stored_role = None

    if doc.exists:
        data = doc.to_dict() or {}
        stored_role = data.get("role")
        if not name:
            name = data.get("name")

    role = resolve_user_role(email, stored_role)

    return CurrentUser(uid=uid, email=email, name=name, role=role)


def require_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Acesso restrito a administradores.",
        )
    return current_user
