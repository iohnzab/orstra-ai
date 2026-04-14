import re
from dataclasses import dataclass
from utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class GuardrailResult:
    triggered: bool
    rule_id: str | None
    rule_type: str | None
    reason: str | None
    action: str | None


def check_guardrails(
    rules: list[dict],
    text: str,
    confidence: float = 1.0,
    current_cost: float = 0.0,
) -> GuardrailResult:
    """
    Check all guardrail rules against the given text, confidence, and cost.
    Returns the first triggered rule, or a non-triggered result.
    Rules are checked in order.
    """
    text_lower = text.lower()

    for rule in rules:
        rule_id = rule.get("id", "")
        rule_type = rule.get("type", "")
        action = rule.get("action", "escalate")

        if rule_type == "keyword_escalate":
            keywords = rule.get("keywords", [])
            for kw in keywords:
                if kw.lower() in text_lower:
                    reason = f"Keyword '{kw}' detected in content"
                    logger.info("guardrail_triggered", rule_id=rule_id, reason=reason)
                    return GuardrailResult(
                        triggered=True,
                        rule_id=rule_id,
                        rule_type=rule_type,
                        reason=reason,
                        action=action,
                    )

        elif rule_type == "confidence_threshold":
            threshold = rule.get("threshold", 0.80)
            if confidence < threshold:
                reason = f"Confidence {confidence:.2f} below threshold {threshold:.2f}"
                logger.info("guardrail_triggered", rule_id=rule_id, reason=reason)
                return GuardrailResult(
                    triggered=True,
                    rule_id=rule_id,
                    rule_type=rule_type,
                    reason=reason,
                    action=action,
                )

        elif rule_type == "cost_limit":
            max_usd = rule.get("max_usd", 0.10)
            if current_cost >= max_usd:
                reason = f"Cost ${current_cost:.4f} exceeds limit ${max_usd:.4f}"
                logger.info("guardrail_triggered", rule_id=rule_id, reason=reason)
                return GuardrailResult(
                    triggered=True,
                    rule_id=rule_id,
                    rule_type=rule_type,
                    reason=reason,
                    action=action,
                )

        elif rule_type == "custom_instruction":
            # Custom instructions don't block — they're injected into the system prompt
            continue

    return GuardrailResult(
        triggered=False,
        rule_id=None,
        rule_type=None,
        reason=None,
        action=None,
    )


def get_custom_instructions(rules: list[dict]) -> list[str]:
    """Extract custom instruction strings from guardrail rules."""
    instructions = []
    for rule in rules:
        if rule.get("type") == "custom_instruction":
            instruction = rule.get("instruction", "")
            if instruction:
                instructions.append(instruction)
    return instructions
