from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.connection import get_db
from database.models import Agent
from api.auth import get_current_user, User
from core.orchestrator import AgentOrchestrator

router = APIRouter(tags=["test"])


class TestRunRequest(BaseModel):
    trigger_data: dict
    dry_run: bool = True


@router.post("/agents/{agent_id}/test")
def test_agent(
    agent_id: str,
    req: TestRunRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    orchestrator = AgentOrchestrator(db=db)
    result = orchestrator.run(
        agent=agent,
        trigger_data=req.trigger_data,
        dry_run=True,  # Always dry_run for test endpoint
    )

    return {
        **result,
        "is_test": True,
        "notice": "This is a test run — no real emails, messages, or CRM updates were sent.",
    }
