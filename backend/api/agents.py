import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any

from database.connection import get_db
from database.models import Agent, AgentVersion
from api.auth import get_current_user, User

router = APIRouter(prefix="/agents", tags=["agents"])


class AgentCreate(BaseModel):
    name: str
    description: str | None = None
    industry: str | None = None
    trigger_type: str | None = None
    trigger_config: dict = {}
    tools_enabled: list[str] = []
    system_prompt: str | None = None
    ai_model: str | None = None
    guardrails: list[dict] = []


class AgentUpdate(AgentCreate):
    pass


class AgentResponse(BaseModel):
    id: str
    name: str
    description: str | None
    industry: str | None
    status: str
    trigger_type: str | None
    trigger_config: dict
    tools_enabled: list[str]
    system_prompt: str | None
    guardrails: list[dict]
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def agent_to_response(agent: Agent) -> dict:
    return {
        "id": str(agent.id),
        "name": agent.name,
        "description": agent.description,
        "industry": agent.industry,
        "status": agent.status,
        "trigger_type": agent.trigger_type,
        "trigger_config": agent.trigger_config or {},
        "tools_enabled": agent.tools_enabled or [],
        "system_prompt": agent.system_prompt,
        "ai_model": agent.ai_model,
        "guardrails": agent.guardrails or [],
        "version": agent.version,
        "created_at": agent.created_at.isoformat(),
        "updated_at": agent.updated_at.isoformat(),
    }


@router.get("")
def list_agents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    agents = db.query(Agent).filter(Agent.user_id == current_user.id).order_by(Agent.created_at.desc()).all()
    return [agent_to_response(a) for a in agents]


@router.post("", status_code=201)
def create_agent(req: AgentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    agent = Agent(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=req.name,
        description=req.description,
        industry=req.industry,
        status="draft",
        trigger_type=req.trigger_type,
        trigger_config=req.trigger_config,
        tools_enabled=req.tools_enabled,
        system_prompt=req.system_prompt,
        ai_model=req.ai_model,
        guardrails=req.guardrails,
        version=1,
        updated_at=datetime.utcnow(),
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent_to_response(agent)


@router.get("/{agent_id}")
def get_agent(agent_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent_to_response(agent)


@router.put("/{agent_id}")
def update_agent(
    agent_id: str,
    req: AgentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Save version snapshot before updating
    snapshot = agent_to_response(agent)
    version_record = AgentVersion(
        id=uuid.uuid4(),
        agent_id=agent.id,
        version=agent.version,
        snapshot=snapshot,
    )
    db.add(version_record)

    # Update agent
    agent.name = req.name
    agent.description = req.description
    agent.industry = req.industry
    agent.trigger_type = req.trigger_type
    agent.trigger_config = req.trigger_config
    agent.tools_enabled = req.tools_enabled
    agent.system_prompt = req.system_prompt
    agent.ai_model = req.ai_model
    agent.guardrails = req.guardrails
    agent.version = agent.version + 1
    agent.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(agent)
    return agent_to_response(agent)


@router.delete("/{agent_id}", status_code=204)
def delete_agent(agent_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.delete(agent)
    db.commit()


@router.post("/{agent_id}/deploy")
def deploy_agent(agent_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.status = "active"
    agent.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "active", "agent_id": agent_id}


@router.post("/{agent_id}/pause")
def pause_agent(agent_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.status = "paused"
    agent.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "paused", "agent_id": agent_id}


@router.get("/{agent_id}/versions")
def list_versions(agent_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    versions = (
        db.query(AgentVersion)
        .filter(AgentVersion.agent_id == agent.id)
        .order_by(AgentVersion.version.desc())
        .all()
    )
    return [
        {
            "id": str(v.id),
            "version": v.version,
            "snapshot": v.snapshot,
            "created_at": v.created_at.isoformat(),
        }
        for v in versions
    ]


@router.post("/{agent_id}/versions/{version}/restore")
def restore_version(
    agent_id: str,
    version: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    version_record = (
        db.query(AgentVersion)
        .filter(AgentVersion.agent_id == agent.id, AgentVersion.version == version)
        .first()
    )
    if not version_record:
        raise HTTPException(status_code=404, detail="Version not found")

    snapshot = version_record.snapshot

    # Save current as a version first
    current_snapshot = agent_to_response(agent)
    new_version_record = AgentVersion(
        id=uuid.uuid4(),
        agent_id=agent.id,
        version=agent.version,
        snapshot=current_snapshot,
    )
    db.add(new_version_record)

    # Restore from snapshot
    agent.name = snapshot.get("name", agent.name)
    agent.description = snapshot.get("description")
    agent.industry = snapshot.get("industry")
    agent.trigger_type = snapshot.get("trigger_type")
    agent.trigger_config = snapshot.get("trigger_config", {})
    agent.tools_enabled = snapshot.get("tools_enabled", [])
    agent.system_prompt = snapshot.get("system_prompt")
    agent.guardrails = snapshot.get("guardrails", [])
    agent.version = agent.version + 1
    agent.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(agent)
    return agent_to_response(agent)
