from triggers.base_trigger import BaseTrigger
from utils.logger import get_logger

logger = get_logger(__name__)


class WebhookTrigger(BaseTrigger):
    trigger_type = "webhook"

    def start(self, agent_id: str, config: dict) -> None:
        # Webhook triggers are passive — FastAPI handles the POST endpoint
        logger.info("webhook_trigger_ready", agent_id=agent_id)

    def stop(self, agent_id: str) -> None:
        logger.info("webhook_trigger_stop", agent_id=agent_id)
