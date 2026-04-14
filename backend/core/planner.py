import json
import anthropic
from config import get_settings
from utils.logger import get_logger
from core.guardrails import get_custom_instructions

logger = get_logger(__name__)
settings = get_settings()


def calculate_cost(input_tokens: int, output_tokens: int) -> float:
    return (
        (input_tokens / 1_000_000) * settings.claude_input_cost
        + (output_tokens / 1_000_000) * settings.claude_output_cost
    )


class Planner:
    def __init__(self, api_key: str | None = None, model: str | None = None):
        key = api_key or settings.anthropic_api_key
        if not key:
            raise ValueError("No Anthropic API key available. Please add your API key in Settings.")
        self.client = anthropic.Anthropic(api_key=key)
        self.model = model or settings.anthropic_model

    def plan(
        self,
        trigger_data: dict,
        agent_description: str,
        system_prompt: str,
        guardrails: list[dict],
        available_tools: list[str],
    ) -> tuple[dict, float, dict]:
        """
        Call Claude once to classify intent and plan tool usage.
        Returns (plan_dict, cost_usd, ai_call_log).
        """
        custom_instructions = get_custom_instructions(guardrails)
        instructions_text = "\n".join(f"- {i}" for i in custom_instructions)
        tools_list = ", ".join(available_tools) if available_tools else "none"
        trigger_text = json.dumps(trigger_data, indent=2)

        system = f"""You are an AI agent planner. Analyze the incoming trigger data and create a plan.

Agent Description: {agent_description}

{f'Agent Instructions: {system_prompt}' if system_prompt else ''}

{f'Custom Rules:{chr(10)}{instructions_text}' if instructions_text else ''}

Available tools: {tools_list}

Respond with ONLY valid JSON in exactly this format (no markdown, no extra text):
{{
  "intent": "brief description of what the user/trigger wants",
  "urgency": "low|medium|high",
  "sentiment": "positive|neutral|negative|frustrated",
  "escalate": false,
  "escalate_reason": null,
  "tools_needed": ["list", "of", "tool", "names"],
  "confidence": 0.85,
  "plan": "brief description of what the agent will do"
}}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=512,
            system=system,
            messages=[
                {"role": "user", "content": f"Trigger data:\n{trigger_text}"}
            ],
        )

        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens
        cost = calculate_cost(input_tokens, output_tokens)

        raw = response.content[0].text.strip()
        # Strip markdown code fences if Claude adds them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        try:
            plan = json.loads(raw)
        except Exception:
            plan = {
                "intent": "unknown",
                "urgency": "medium",
                "sentiment": "neutral",
                "escalate": False,
                "escalate_reason": None,
                "tools_needed": [],
                "confidence": 0.5,
                "plan": "Unable to parse plan",
            }

        ai_call_log = {
            "step": "plan",
            "model": settings.anthropic_model,
            "prompt_tokens": input_tokens,
            "completion_tokens": output_tokens,
            "cost_usd": cost,
            "response": plan,
        }

        return plan, cost, ai_call_log

    def generate_output(
        self,
        trigger_data: dict,
        system_prompt: str,
        tool_results: list[dict],
        agent_description: str,
        guardrails: list[dict],
    ) -> tuple[dict, float, dict]:
        """
        Call Claude a second time to generate the final action/output.
        Returns (output_dict, cost_usd, ai_call_log).
        """
        custom_instructions = get_custom_instructions(guardrails)
        instructions_text = "\n".join(f"- {i}" for i in custom_instructions)

        tool_context = ""
        for tr in tool_results:
            tool_context += f"\n\n[{tr['tool']}] Input: {tr['input']}\nResult: {tr['output']}"

        trigger_text = json.dumps(trigger_data, indent=2)

        system = f"""You are an AI agent. Based on the trigger and tool results, generate the appropriate action.

Agent Description: {agent_description}

{f'Instructions: {system_prompt}' if system_prompt else ''}

{f'Rules to follow:{chr(10)}{instructions_text}' if instructions_text else ''}

Respond with ONLY valid JSON (no markdown, no extra text):
{{
  "action_type": "send_email|post_slack|update_crm|no_action",
  "content": "the actual text content for the action",
  "recipient": "optional - who to send to",
  "confidence": 0.9,
  "reasoning": "brief explanation of why this action was chosen"
}}"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=system,
            messages=[
                {
                    "role": "user",
                    "content": f"Original trigger:\n{trigger_text}\n\nTool results:{tool_context}",
                }
            ],
        )

        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens
        cost = calculate_cost(input_tokens, output_tokens)

        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        try:
            output = json.loads(raw)
        except Exception:
            output = {
                "action_type": "no_action",
                "content": raw,
                "confidence": 0.5,
                "reasoning": "JSON parse failed — raw response returned",
            }

        ai_call_log = {
            "step": "generate_output",
            "model": settings.anthropic_model,
            "prompt_tokens": input_tokens,
            "completion_tokens": output_tokens,
            "cost_usd": cost,
            "response": output,
        }

        return output, cost, ai_call_log
