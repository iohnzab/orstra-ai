import httpx
from connectors.base_connector import BaseConnector


class SlackConnector(BaseConnector):
    service = "slack"
    display_name = "Slack"

    def verify(self, credentials: dict) -> bool:
        try:
            bot_token = credentials.get("bot_token", "")
            if not bot_token:
                return False
            url = "https://slack.com/api/auth.test"
            headers = {"Authorization": f"Bearer {bot_token}"}
            with httpx.Client(timeout=10) as client:
                response = client.post(url, headers=headers)
                data = response.json()
                return data.get("ok", False)
        except Exception:
            return False

    def get_credential_fields(self) -> list[dict]:
        return [
            {"name": "bot_token", "label": "Bot Token", "type": "password", "required": True,
             "placeholder": "xoxb-..."},
            {"name": "default_channel", "label": "Default Channel", "type": "text", "required": False,
             "placeholder": "#general"},
        ]
