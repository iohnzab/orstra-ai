from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Agent
from core.orchestrator import AgentOrchestrator
from utils.logger import get_logger

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = get_logger(__name__)


@router.post("/agent/{agent_id}")
async def agent_webhook(
    agent_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public webhook endpoint — any external tool (Zapier, Make, Gmail, etc.)
    can POST here to trigger an agent run.
    No auth required, but agent must be active.
    """
    agent = db.query(Agent).filter(
        Agent.id == agent_id,
        Agent.status == "active",
    ).first()

    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found or not active. Make sure the agent is deployed.")

    # Parse the incoming payload as trigger_data
    try:
        trigger_data = await request.json()
    except Exception:
        # If body isn't JSON, grab form data or query params
        try:
            form = await request.form()
            trigger_data = dict(form)
        except Exception:
            trigger_data = dict(request.query_params)

    logger.info("webhook_received", agent_id=agent_id, trigger_data=str(trigger_data)[:200])

    orchestrator = AgentOrchestrator(db)
    result = orchestrator.run(agent, trigger_data, dry_run=False)

    return {
        "run_id": result.get("run_id"),
        "status": result.get("status"),
        "intent": result.get("intent"),
        "output": result.get("output", {}),
        "cost_usd": result.get("cost_usd", 0),
    }


@router.get("/agent/{agent_id}/info")
def webhook_info(agent_id: str, db: Session = Depends(get_db)):
    """Return info about the webhook endpoint for this agent."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    from config import get_settings
    settings = get_settings()

    return {
        "agent_id": agent_id,
        "agent_name": agent.name,
        "status": agent.status,
        "webhook_url": f"{settings.api_base_url}/webhooks/agent/{agent_id}",
        "method": "POST",
        "content_type": "application/json",
        "example_payload": {
            "from": "customer@example.com",
            "subject": "I need help",
            "body": "Hi, I have a question about my order.",
        },
    }
