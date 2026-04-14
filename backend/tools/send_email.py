import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from tools.base import BaseTool
from utils.logger import get_logger

logger = get_logger(__name__)


class SendEmailTool(BaseTool):
    name = "send_email"
    description = (
        "Send an email to a recipient. Use this tool when the agent needs to reply to a customer, "
        "send a notification, or deliver a report via email. "
        "Input must include: to (recipient email), subject, and body (the email content). "
        "Only use when explicitly required — do not send emails without clear intent to do so."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "to": {"type": "string", "description": "Recipient email address"},
            "subject": {"type": "string", "description": "Email subject line"},
            "body": {"type": "string", "description": "Email body content (plain text or HTML)"},
            "reply_to": {"type": "string", "description": "Optional reply-to email address"},
        },
        "required": ["to", "subject", "body"],
    }

    def __init__(self, gmail_creds: dict | None = None, dry_run: bool = False):
        self.gmail_creds = gmail_creds or {}
        self.dry_run = dry_run

    def run(self, input: str) -> str:
        try:
            try:
                data = json.loads(input)
            except Exception:
                return "Invalid input: expected JSON with to, subject, body fields."

            to = data.get("to", "")
            subject = data.get("subject", "")
            body = data.get("body", "")

            if not all([to, subject, body]):
                return "Missing required fields: to, subject, body"

            if self.dry_run:
                return f"[DRY RUN] Would send email to {to} with subject: '{subject}'"

            smtp_user = self.gmail_creds.get("smtp_user", "")
            smtp_password = self.gmail_creds.get("smtp_password", "")
            smtp_host = self.gmail_creds.get("smtp_host", "smtp.gmail.com")
            smtp_port = int(self.gmail_creds.get("smtp_port", 587))

            if not smtp_user or not smtp_password:
                return "Gmail credentials not configured."

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_user
            msg["To"] = to

            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, to, msg.as_string())

            logger.info("email_sent", to=to, subject=subject)
            return f"Email successfully sent to {to}"

        except Exception as e:
            logger.error("send_email_error", error=str(e))
            return f"Failed to send email: {str(e)}"
