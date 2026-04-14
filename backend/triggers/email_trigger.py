import time
import threading
from triggers.base_trigger import BaseTrigger
from utils.logger import get_logger

logger = get_logger(__name__)


class EmailTrigger(BaseTrigger):
    trigger_type = "email"
    _running: dict[str, bool] = {}

    def start(self, agent_id: str, config: dict) -> None:
        self._running[agent_id] = True
        inbox = config.get("inbox", "")
        thread = threading.Thread(
            target=self._poll_loop,
            args=(agent_id, inbox),
            daemon=True,
        )
        thread.start()
        logger.info("email_trigger_start", agent_id=agent_id, inbox=inbox)

    def stop(self, agent_id: str) -> None:
        self._running[agent_id] = False
        logger.info("email_trigger_stop", agent_id=agent_id)

    def _poll_loop(self, agent_id: str, inbox: str) -> None:
        while self._running.get(agent_id, False):
            # In production: use Gmail API to poll for new messages
            # and enqueue them to RQ for processing
            time.sleep(60)
