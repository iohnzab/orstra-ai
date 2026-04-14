import json
import httpx
from tools.base import BaseTool
from utils.logger import get_logger

logger = get_logger(__name__)


class SlackNotifyTool(BaseTool):
    name = "slack_notify"
    description = (
        "Post a message to a Slack channel. Use this when you need to alert a team, "
        "escalate an issue for human review, send a summary or report, or notify team members "
        "of important events. Specify the channel and message content."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "channel": {"type": "string", "description": "Slack channel name (e.g. #support, #alerts)"},
            "message": {"type": "string", "description": "The message to post"},
        },
        "required": ["channel", "message"],
    }

    def __init__(self, slack_creds: dict | None = None, dry_run: bool = False):
        self.creds = slack_creds or {}
        self.dry_run = dry_run

    def run(self, input: str) -> str:
        try:
            try:
                data = json.loads(input)
            except Exception:
                return "Invalid input: expected JSON with channel and message fields."

            channel = data.get("channel", "#general")
            message = data.get("message", "")

            if not message:
                return "No message content provided."

            if self.dry_run:
                return f"[DRY RUN] Would post to {channel}: {message[:100]}..."

            bot_token = self.creds.get("bot_token", "")
            if not bot_token:
                return f"[MOCK] Posted to {channel}: {message[:100]}..."

            url = "https://slack.com/api/chat.postMessage"
            headers = {"Authorization": f"Bearer {bot_token}", "Content-Type": "application/json"}
            payload = {"channel": channel, "text": message}

            with httpx.Client() as client:
                response = client.post(url, headers=headers, json=payload, timeout=10)
                result = response.json()

            if result.get("ok"):
                return f"Message posted successfully to {channel}"
            else:
                return f"Slack error: {result.get('error', 'Unknown error')}"

        except Exception as e:
            logger.error("slack_notify_error", error=str(e))
            return f"Slack notification failed: {str(e)}"
