from connectors.base_connector import BaseConnector


class WebhookConnector(BaseConnector):
    service = "webhook"
    display_name = "Webhook"

    def verify(self, credentials: dict) -> bool:
        return True  # Webhooks don't need verification

    def get_credential_fields(self) -> list[dict]:
        return []  # No credentials needed — we provide the URL
