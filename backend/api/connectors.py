import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.connection import get_db
from database.models import Connector
from api.auth import get_current_user, User
from utils.encryption import encrypt, decrypt

router = APIRouter(prefix="/connectors", tags=["connectors"])

CONNECTOR_REGISTRY = {
    "gmail": "connectors.gmail_connector.GmailConnector",
    "shopify": "connectors.shopify_connector.ShopifyConnector",
    "slack": "connectors.slack_connector.SlackConnector",
    "supabase": "connectors.supabase_connector.SupabaseConnector",
    "webhook": "connectors.webhook_connector.WebhookConnector",
}


class ConnectorCreate(BaseModel):
    service: str
    display_name: str
    credentials: dict


def connector_to_response(connector: Connector) -> dict:
    return {
        "id": str(connector.id),
        "service": connector.service,
        "display_name": connector.display_name,
        "is_active": connector.is_active,
        "created_at": connector.created_at.isoformat(),
    }


@router.get("")
def list_connectors(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    connectors = db.query(Connector).filter(Connector.user_id == current_user.id).all()
    return [connector_to_response(c) for c in connectors]


@router.post("", status_code=201)
def create_connector(
    req: ConnectorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.service not in CONNECTOR_REGISTRY:
        raise HTTPException(status_code=400, detail=f"Unknown service: {req.service}")

    # Check if connector already exists for this user/service
    existing = db.query(Connector).filter(
        Connector.user_id == current_user.id,
        Connector.service == req.service,
    ).first()

    encrypted_creds = encrypt(req.credentials)

    if existing:
        existing.credentials = encrypted_creds
        existing.display_name = req.display_name
        existing.is_active = True
        db.commit()
        return connector_to_response(existing)

    connector = Connector(
        id=uuid.uuid4(),
        user_id=current_user.id,
        service=req.service,
        display_name=req.display_name,
        credentials=encrypted_creds,
        is_active=True,
    )
    db.add(connector)
    db.commit()
    db.refresh(connector)
    return connector_to_response(connector)


@router.delete("/{connector_id}", status_code=204)
def delete_connector(
    connector_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    connector = db.query(Connector).filter(
        Connector.id == connector_id,
        Connector.user_id == current_user.id,
    ).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    db.delete(connector)
    db.commit()


@router.post("/{connector_id}/verify")
def verify_connector(
    connector_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    connector = db.query(Connector).filter(
        Connector.id == connector_id,
        Connector.user_id == current_user.id,
    ).first()
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")

    try:
        creds = decrypt(connector.credentials)
        class_path = CONNECTOR_REGISTRY.get(connector.service)
        if not class_path:
            return {"verified": False, "error": "Unknown connector type"}

        module_path, class_name = class_path.rsplit(".", 1)
        import importlib
        module = importlib.import_module(module_path)
        connector_class = getattr(module, class_name)
        instance = connector_class()
        verified = instance.verify(creds)
        return {"verified": verified}
    except Exception as e:
        return {"verified": False, "error": str(e)}
