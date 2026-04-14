from triggers.base_trigger import BaseTrigger
from utils.logger import get_logger

logger = get_logger(__name__)


class ScheduleTrigger(BaseTrigger):
    trigger_type = "schedule"

    def start(self, agent_id: str, config: dict) -> None:
        cron = config.get("cron", "0 9 * * 1")
        logger.info("schedule_trigger_start", agent_id=agent_id, cron=cron)
        # In production: use rq-scheduler to enqueue jobs on the cron schedule

    def stop(self, agent_id: str) -> None:
        logger.info("schedule_trigger_stop", agent_id=agent_id)
