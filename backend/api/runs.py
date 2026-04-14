from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import TaskRun, Agent
from api.auth import get_current_user, User

router = APIRouter(tags=["runs"])


def run_to_response(run: TaskRun) -> dict:
    return {
        "id": str(run.id),
        "agent_id": str(run.agent_id),
        "trigger_data": run.trigger_data,
        "status": run.status,
        "intent": run.intent,
        "confidence": run.confidence,
        "tools_called": run.tools_called or [],
        "ai_calls": run.ai_calls or [],
        "escalated": run.escalated,
        "escalation_reason": run.escalation_reason,
        "output": run.output or {},
        "cost_usd": run.cost_usd,
        "duration_ms": run.duration_ms,
        "error": run.error,
        "created_at": run.created_at.isoformat(),
    }


@router.get("/agents/{agent_id}/runs")
def list_agent_runs(
    agent_id: str,
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    runs = (
        db.query(TaskRun)
        .filter(TaskRun.agent_id == agent_id)
        .order_by(TaskRun.created_at.desc())
        .limit(limit)
        .all()
    )
    return [run_to_response(r) for r in runs]


@router.get("/runs/{run_id}")
def get_run(run_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    run = db.query(TaskRun).filter(TaskRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # Verify ownership
    agent = db.query(Agent).filter(Agent.id == run.agent_id, Agent.user_id == current_user.id).first()
    if not agent:
        raise HTTPException(status_code=403, detail="Access denied")

    return run_to_response(run)


@router.get("/dashboard/stats")
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy import func
    from datetime import datetime, timedelta
    from database.models import Agent

    agents = db.query(Agent).filter(Agent.user_id == current_user.id).all()
    agent_ids = [a.id for a in agents]

    if not agent_ids:
        return {
            "total_agents": 0,
            "active_agents": 0,
            "runs_today": 0,
            "success_rate": 0.0,
            "total_cost_this_month": 0.0,
            "recent_runs": [],
        }

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    runs_today = db.query(func.count(TaskRun.id)).filter(
        TaskRun.agent_id.in_(agent_ids),
        TaskRun.created_at >= today_start,
    ).scalar()

    total_runs = db.query(func.count(TaskRun.id)).filter(TaskRun.agent_id.in_(agent_ids)).scalar()
    completed_runs = db.query(func.count(TaskRun.id)).filter(
        TaskRun.agent_id.in_(agent_ids),
        TaskRun.status == "completed",
    ).scalar()

    success_rate = (completed_runs / total_runs * 100) if total_runs > 0 else 0.0

    total_cost = db.query(func.coalesce(func.sum(TaskRun.cost_usd), 0.0)).filter(
        TaskRun.agent_id.in_(agent_ids),
        TaskRun.created_at >= month_start,
    ).scalar()

    active_agents = sum(1 for a in agents if a.status == "active")

    # Recent runs with agent names
    recent_runs_query = (
        db.query(TaskRun, Agent.name.label("agent_name"))
        .join(Agent, TaskRun.agent_id == Agent.id)
        .filter(TaskRun.agent_id.in_(agent_ids))
        .order_by(TaskRun.created_at.desc())
        .limit(20)
        .all()
    )

    recent_runs = []
    for run, agent_name in recent_runs_query:
        recent_runs.append({
            **run_to_response(run),
            "agent_name": agent_name,
        })

    return {
        "total_agents": len(agents),
        "active_agents": active_agents,
        "runs_today": runs_today,
        "success_rate": round(success_rate, 1),
        "total_cost_this_month": round(float(total_cost), 4),
        "recent_runs": recent_runs,
    }
