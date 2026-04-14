from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.connection import get_db
from database.models import User
from api.auth import get_current_user
from utils.encryption import encrypt, decrypt

router = APIRouter(prefix="/settings", tags=["settings"])


class ApiKeyUpdate(BaseModel):
    anthropic_api_key: str


@router.get("")
def get_settings(current_user: User = Depends(get_current_user)):
    """Return current settings — never expose the raw key, just whether it's set."""
    return {
        "anthropic_api_key_set": bool(current_user.anthropic_api_key),
        "anthropic_api_key_preview": (
            "sk-ant-..." + current_user.anthropic_api_key[-4:]
            if current_user.anthropic_api_key
            else None
        ),
        "email": current_user.email,
        "full_name": current_user.full_name,
    }


@router.put("/api-key")
def save_api_key(
    req: ApiKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not req.anthropic_api_key.startswith("sk-ant-"):
        raise HTTPException(status_code=400, detail="Invalid Anthropic API key format — should start with sk-ant-")

    current_user.anthropic_api_key = encrypt({"key": req.anthropic_api_key})
    db.commit()
    return {"message": "API key saved successfully"}


@router.delete("/api-key")
def delete_api_key(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.anthropic_api_key = None
    db.commit()
    return {"message": "API key removed"}


def get_user_api_key(user: User) -> str | None:
    """Decrypt and return the user's Anthropic API key."""
    if not user.anthropic_api_key:
        return None
    try:
        data = decrypt(user.anthropic_api_key)
        return data.get("key")
    except Exception:
        return None
