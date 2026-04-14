from connectors.base_connector import BaseConnector


class GmailConnector(BaseConnector):
    service = "gmail"
    display_name = "Gmail"

    def verify(self, credentials: dict) -> bool:
        try:
            import smtplib
            smtp_user = credentials.get("smtp_user", "")
            smtp_password = credentials.get("smtp_password", "")
            if not smtp_user or not smtp_password:
                return False
            with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
            return True
        except Exception:
            return False

    def get_credential_fields(self) -> list[dict]:
        return [
            {"name": "smtp_user", "label": "Gmail Address", "type": "email", "required": True},
            {"name": "smtp_password", "label": "App Password", "type": "password", "required": True,
             "hint": "Generate an App Password in Google Account settings"},
        ]
