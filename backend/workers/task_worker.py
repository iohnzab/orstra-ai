import redis
from rq import Worker, Queue, Connection
from config import get_settings
from utils.logger import get_logger, setup_logging

setup_logging(debug=True)
logger = get_logger(__name__)

settings = get_settings()


def run_agent_task(agent_id: str, trigger_data: dict, dry_run: bool = False) -> dict:
    """RQ task function — runs an agent asynchronously."""
    from database.connection import SessionLocal
    from database.models import Agent
    from core.orchestrator import AgentOrchestrator

    db = SessionLocal()
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return {"error": f"Agent {agent_id} not found"}

        orchestrator = AgentOrchestrator(db=db)
        result = orchestrator.run(agent=agent, trigger_data=trigger_data, dry_run=dry_run)
        return result
    finally:
        db.close()


if __name__ == "__main__":
    conn = redis.from_url(settings.redis_url)
    with Connection(conn):
        queues = [Queue("agents"), Queue("default")]
        worker = Worker(queues)
        logger.info("worker_starting", queues=["agents", "default"])
        worker.work(with_scheduler=True)
