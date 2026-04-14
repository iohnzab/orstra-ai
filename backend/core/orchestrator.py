import json
import time
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from database.models import Agent, TaskRun, Connector, AgentConnector, User
from core.planner import Planner
from core.guardrails import check_guardrails
from tools.registry import ToolRegistry
from utils.logger import get_logger

logger = get_logger(__name__)


class AgentOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.tool_registry = ToolRegistry()

    def _get_planner(self, agent: Agent) -> Planner:
        """Get planner using the agent owner's API key and the agent's chosen model."""
        from api.settings import get_user_api_key
        user = self.db.query(User).filter(User.id == agent.user_id).first()
        api_key = get_user_api_key(user) if user else None
        return Planner(api_key=api_key, model=agent.ai_model or None)

    def run(
        self,
        agent: Agent,
        trigger_data: dict,
        dry_run: bool = False,
    ) -> dict:
        """
        Main agent execution flow. Returns a result dict with run details.
        """
        start_time = time.time()
        run_id = str(uuid.uuid4())
        total_cost = 0.0
        ai_calls = []
        tools_called = []

        logger.info("orchestrator_start", agent_id=str(agent.id), run_id=run_id, dry_run=dry_run)

        # Create initial TaskRun record
        task_run = TaskRun(
            id=uuid.UUID(run_id),
            agent_id=agent.id,
            trigger_data=trigger_data,
            status="running",
        )
        self.db.add(task_run)
        self.db.commit()

        try:
            # ─────────────────────────────────────────────────────────────
            # STEP 1: Load connectors for this agent
            # ─────────────────────────────────────────────────────────────
            agent_connector_rows = (
                self.db.query(AgentConnector)
                .filter(AgentConnector.agent_id == agent.id)
                .all()
            )
            connector_ids = [ac.connector_id for ac in agent_connector_rows]
            connectors = (
                self.db.query(Connector)
                .filter(Connector.id.in_(connector_ids))
                .all()
            )

            tools_enabled = agent.tools_enabled or []
            guardrails = agent.guardrails or []
            planner = self._get_planner(agent)

            # ─────────────────────────────────────────────────────────────
            # STEP 2: PLAN — classify intent and plan tool usage
            # ─────────────────────────────────────────────────────────────
            logger.info("orchestrator_planning", run_id=run_id)

            plan, plan_cost, plan_log = planner.plan(
                trigger_data=trigger_data,
                agent_description=agent.description or "",
                system_prompt=agent.system_prompt or "",
                guardrails=guardrails,
                available_tools=tools_enabled,
            )

            total_cost += plan_cost
            ai_calls.append(plan_log)

            task_run.intent = plan.get("intent", "")
            task_run.confidence = plan.get("confidence", 0.0)
            self.db.commit()

            # ─────────────────────────────────────────────────────────────
            # STEP 3: CHECK GUARDRAILS (pre-execution)
            # ─────────────────────────────────────────────────────────────
            trigger_text = json.dumps(trigger_data)
            guardrail_result = check_guardrails(
                rules=guardrails,
                text=trigger_text,
                confidence=plan.get("confidence", 1.0),
                current_cost=total_cost,
            )

            if guardrail_result.triggered:
                logger.info("guardrail_pre_execution_triggered", run_id=run_id, reason=guardrail_result.reason)
                self._finalize_run(
                    task_run=task_run,
                    status="escalated",
                    escalated=True,
                    escalation_reason=guardrail_result.reason,
                    output={"action_type": "escalated", "content": guardrail_result.reason},
                    cost=total_cost,
                    ai_calls=ai_calls,
                    tools_called=tools_called,
                    start_time=start_time,
                )
                return {"run_id": run_id, "status": "escalated", "reason": guardrail_result.reason}

            # Also check if planner itself wants to escalate
            if plan.get("escalate"):
                reason = plan.get("escalate_reason", "Agent decided to escalate")
                logger.info("planner_escalation", run_id=run_id, reason=reason)
                self._finalize_run(
                    task_run=task_run,
                    status="escalated",
                    escalated=True,
                    escalation_reason=reason,
                    output={"action_type": "escalated", "content": reason},
                    cost=total_cost,
                    ai_calls=ai_calls,
                    tools_called=tools_called,
                    start_time=start_time,
                )
                return {"run_id": run_id, "status": "escalated", "reason": reason}

            # ─────────────────────────────────────────────────────────────
            # STEP 4: EXECUTE TOOLS
            # ─────────────────────────────────────────────────────────────
            tools_needed = plan.get("tools_needed", [])
            available_tools = self.tool_registry.get_tools_for_agent(
                agent_id=str(agent.id),
                tools_enabled=tools_enabled,
                connectors=connectors,
                db_session=self.db,
                dry_run=dry_run,
            )

            tool_map = {t.name: t for t in available_tools}
            tool_results = []

            for tool_name in tools_needed[:5]:  # Max 5 tool calls
                if tool_name not in tool_map:
                    logger.warning("tool_not_found", tool_name=tool_name, run_id=run_id)
                    continue

                tool = tool_map[tool_name]
                tool_input = json.dumps(trigger_data)

                logger.info("tool_call_start", tool=tool_name, run_id=run_id)
                tool_start = time.time()

                try:
                    tool_output = tool.run(tool_input)
                except Exception as e:
                    tool_output = f"Tool error: {str(e)}"
                    logger.error("tool_call_error", tool=tool_name, error=str(e))

                tool_duration_ms = int((time.time() - tool_start) * 1000)

                tool_log = {
                    "tool": tool_name,
                    "input": tool_input[:500],
                    "output": str(tool_output)[:2000],
                    "duration_ms": tool_duration_ms,
                }
                tools_called.append(tool_log)
                tool_results.append({"tool": tool_name, "input": tool_input, "output": str(tool_output)})

                logger.info("tool_call_done", tool=tool_name, duration_ms=tool_duration_ms)

            # ─────────────────────────────────────────────────────────────
            # STEP 5: GENERATE OUTPUT
            # ─────────────────────────────────────────────────────────────
            logger.info("orchestrator_generating_output", run_id=run_id)

            output, output_cost, output_log = planner.generate_output(
                trigger_data=trigger_data,
                system_prompt=agent.system_prompt or "",
                tool_results=tool_results,
                agent_description=agent.description or "",
                guardrails=guardrails,
            )

            total_cost += output_cost
            ai_calls.append(output_log)

            # ─────────────────────────────────────────────────────────────
            # STEP 6: CHECK GUARDRAILS AGAIN (post-generation)
            # ─────────────────────────────────────────────────────────────
            output_text = output.get("content", "")
            post_guardrail = check_guardrails(
                rules=guardrails,
                text=output_text,
                confidence=output.get("confidence", 1.0),
                current_cost=total_cost,
            )

            if post_guardrail.triggered:
                logger.info("guardrail_post_generation_triggered", run_id=run_id, reason=post_guardrail.reason)
                self._finalize_run(
                    task_run=task_run,
                    status="escalated",
                    escalated=True,
                    escalation_reason=post_guardrail.reason,
                    output=output,
                    cost=total_cost,
                    ai_calls=ai_calls,
                    tools_called=tools_called,
                    start_time=start_time,
                )
                return {"run_id": run_id, "status": "escalated", "reason": post_guardrail.reason}

            # ─────────────────────────────────────────────────────────────
            # STEP 7: EXECUTE ACTION
            # ─────────────────────────────────────────────────────────────
            if not dry_run:
                action_type = output.get("action_type", "no_action")
                logger.info("executing_action", action_type=action_type, run_id=run_id)

                if action_type == "send_email" and "send_email" in tool_map:
                    import json as _json
                    action_input = _json.dumps({
                        "to": output.get("recipient", trigger_data.get("from", "")),
                        "subject": f"Re: {trigger_data.get('subject', 'Your inquiry')}",
                        "body": output.get("content", ""),
                    })
                    action_result = tool_map["send_email"].run(action_input)
                    output["action_result"] = action_result

                elif action_type == "post_slack" and "slack_notify" in tool_map:
                    action_input = json.dumps({
                        "channel": "#general",
                        "message": output.get("content", ""),
                    })
                    action_result = tool_map["slack_notify"].run(action_input)
                    output["action_result"] = action_result

                elif action_type == "update_crm" and "update_crm" in tool_map:
                    action_result = tool_map["update_crm"].run(json.dumps(output))
                    output["action_result"] = action_result
            else:
                output["dry_run"] = True
                output["action_result"] = f"[DRY RUN] Would execute: {output.get('action_type', 'no_action')}"

            # ─────────────────────────────────────────────────────────────
            # STEP 8: FINALIZE
            # ─────────────────────────────────────────────────────────────
            self._finalize_run(
                task_run=task_run,
                status="completed",
                escalated=False,
                escalation_reason=None,
                output=output,
                cost=total_cost,
                ai_calls=ai_calls,
                tools_called=tools_called,
                start_time=start_time,
            )

            logger.info("orchestrator_complete", run_id=run_id, cost_usd=total_cost)

            return {
                "run_id": run_id,
                "status": "completed",
                "intent": plan.get("intent"),
                "confidence": plan.get("confidence"),
                "tools_called": tools_called,
                "output": output,
                "cost_usd": total_cost,
                "plan": plan,
                "ai_calls": ai_calls,
                "guardrails_checked": guardrails,
            }

        except Exception as e:
            logger.error("orchestrator_error", run_id=run_id, error=str(e), exc_info=True)
            self._finalize_run(
                task_run=task_run,
                status="failed",
                escalated=False,
                escalation_reason=None,
                output={},
                cost=total_cost,
                ai_calls=ai_calls,
                tools_called=tools_called,
                start_time=start_time,
                error=str(e),
            )
            return {"run_id": run_id, "status": "failed", "error": str(e)}

    def _finalize_run(
        self,
        task_run: TaskRun,
        status: str,
        escalated: bool,
        escalation_reason: str | None,
        output: dict,
        cost: float,
        ai_calls: list,
        tools_called: list,
        start_time: float,
        error: str | None = None,
    ):
        duration_ms = int((time.time() - start_time) * 1000)
        task_run.status = status
        task_run.escalated = escalated
        task_run.escalation_reason = escalation_reason
        task_run.output = output
        task_run.cost_usd = cost
        task_run.ai_calls = ai_calls
        task_run.tools_called = tools_called
        task_run.duration_ms = duration_ms
        task_run.error = error
        self.db.commit()
