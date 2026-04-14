"""
Built-in trigger engine — no Zapier or Make.com needed.

Runs two background jobs every 2 minutes:
  1. Email triggers  — polls Gmail IMAP for unread emails, fires matching agents
  2. Schedule triggers — checks cron expressions, fires agents on schedule
"""

import imaplib
import email
import email.header
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from database.connection import SessionLocal
from database.models import Agent, Connector
from utils.encryption import decrypt
from utils.logger import get_logger

logger = get_logger(__name__)

_scheduler: BackgroundScheduler | None = None


# ─── Email trigger ─────────────────────────────────────────────────────────────

def _decode_str(value: str) -> str:
    """Decode encoded email header values."""
    parts = email.header.decode_header(value)
    result = []
    for part, enc in parts:
        if isinstance(part, bytes):
            result.append(part.decode(enc or "utf-8", errors="replace"))
        else:
            result.append(part)
    return "".join(result)


def _get_body(msg) -> str:
    """Extract plain text body from email message."""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                try:
                    return part.get_payload(decode=True).decode("utf-8", errors="replace")
                except Exception:
                    pass
        # Fallback to HTML
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                try:
                    return part.get_payload(decode=True).decode("utf-8", errors="replace")[:2000]
                except Exception:
                    pass
    else:
        try:
            return msg.get_payload(decode=True).decode("utf-8", errors="replace")
        except Exception:
            pass
    return ""


def _process_email_agent(agent: Agent, db) -> int:
    """Connect to Gmail, fetch unread emails, run the agent. Returns count of emails processed."""
    connector = db.query(Connector).filter(
        Connector.user_id == agent.user_id,
        Connector.service == "gmail",
        Connector.is_active == True,
    ).first()

    if not connector:
        logger.debug("email_trigger_no_connector", agent_id=str(agent.id))
        return 0

    try:
        creds = decrypt(connector.credentials)
    except Exception as e:
        logger.warning("email_trigger_decrypt_failed", agent_id=str(agent.id), error=str(e))
        return 0

    smtp_user = creds.get("smtp_user", "")
    smtp_password = creds.get("smtp_password", "")
    if not smtp_user or not smtp_password:
        return 0

    # Filter by subject keywords if configured
    subject_filter = agent.trigger_config.get("subject_keywords", "") if agent.trigger_config else ""
    inbox = agent.trigger_config.get("inbox", "") if agent.trigger_config else ""

    processed = 0
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com", timeout=15)
        mail.login(smtp_user, smtp_password)
        mail.select("inbox")

        # Search for unseen emails
        status, data = mail.search(None, "UNSEEN")
        if status != "OK" or not data[0]:
            mail.logout()
            return 0

        email_ids = data[0].split()
        logger.info("email_trigger_checking", agent_id=str(agent.id), unseen_count=len(email_ids))

        from core.orchestrator import AgentOrchestrator

        for email_id in email_ids[:5]:  # Max 5 per check to avoid overload
            try:
                status, msg_data = mail.fetch(email_id, "(RFC822)")
                if status != "OK":
                    continue

                msg = email.message_from_bytes(msg_data[0][1])
                from_addr = msg.get("From", "")
                subject = _decode_str(msg.get("Subject", ""))
                body = _get_body(msg)

                # Apply subject keyword filter
                if subject_filter:
                    keywords = [k.strip().lower() for k in subject_filter.split(",")]
                    if not any(k in subject.lower() or k in body.lower() for k in keywords):
                        continue  # Skip — doesn't match filter

                trigger_data = {
                    "from": from_addr,
                    "subject": subject,
                    "body": body[:2000],
                    "source": "email_trigger",
                }

                # Mark as read so we don't process it again
                mail.store(email_id, "+FLAGS", "\\Seen")

                # Fire the agent
                orchestrator = AgentOrchestrator(db)
                orchestrator.run(agent, trigger_data, dry_run=False)
                processed += 1

                logger.info("email_trigger_fired", agent_id=str(agent.id), from_addr=from_addr, subject=subject[:80])

            except Exception as e:
                logger.error("email_trigger_process_error", agent_id=str(agent.id), error=str(e))

        mail.logout()

    except Exception as e:
        logger.error("email_trigger_imap_error", agent_id=str(agent.id), error=str(e))

    return processed


def check_email_triggers():
    """Job: poll Gmail for all active email-trigger agents."""
    db = SessionLocal()
    try:
        agents = db.query(Agent).filter(
            Agent.status == "active",
            Agent.trigger_type == "email",
        ).all()

        if not agents:
            return

        logger.info("email_trigger_job_start", agent_count=len(agents))
        for agent in agents:
            try:
                _process_email_agent(agent, db)
            except Exception as e:
                logger.error("email_trigger_agent_error", agent_id=str(agent.id), error=str(e))
    finally:
        db.close()


# ─── Schedule trigger ──────────────────────────────────────────────────────────

def check_schedule_triggers():
    """Job: fire agents whose cron schedule is due."""
    db = SessionLocal()
    try:
        agents = db.query(Agent).filter(
            Agent.status == "active",
            Agent.trigger_type == "schedule",
        ).all()

        if not agents:
            return

        now = datetime.utcnow()

        for agent in agents:
            try:
                cron_expr = (agent.trigger_config or {}).get("cron", "")
                if not cron_expr:
                    continue

                import croniter
                cron = croniter.croniter(cron_expr, now)
                prev_run = cron.get_prev(datetime)

                # Fire if the cron was due in the last 2 minutes (matches our poll interval)
                if (now - prev_run).total_seconds() <= 120:
                    trigger_data = {
                        "scheduled_at": now.isoformat(),
                        "cron": cron_expr,
                        "source": "schedule_trigger",
                    }
                    from core.orchestrator import AgentOrchestrator
                    orchestrator = AgentOrchestrator(db)
                    orchestrator.run(agent, trigger_data, dry_run=False)
                    logger.info("schedule_trigger_fired", agent_id=str(agent.id), cron=cron_expr)

            except Exception as e:
                logger.error("schedule_trigger_error", agent_id=str(agent.id), error=str(e))
    finally:
        db.close()


# ─── Scheduler lifecycle ───────────────────────────────────────────────────────

def start_scheduler():
    global _scheduler
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        check_email_triggers,
        trigger=IntervalTrigger(minutes=2),
        id="email_triggers",
        max_instances=1,
        coalesce=True,
    )
    _scheduler.add_job(
        check_schedule_triggers,
        trigger=IntervalTrigger(minutes=2),
        id="schedule_triggers",
        max_instances=1,
        coalesce=True,
    )
    _scheduler.start()
    logger.info("trigger_scheduler_started", jobs=["email_triggers", "schedule_triggers"])


def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("trigger_scheduler_stopped")
