"""
Seed script — creates demo user and sample agents/runs.
Run with: python seed.py
"""
import uuid
import random
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database.connection import SessionLocal, create_tables
from database.models import User, Agent, TaskRun
from api.auth import hash_password

INTENTS = [
    "Customer asking about order status",
    "Product inquiry from new customer",
    "Refund request",
    "Shipping delay complaint",
    "Product recommendation request",
    "Account login issue",
    "Weekly sales report generation",
    "Inventory alert notification",
]

TOOLS = [
    ["search_docs", "send_email"],
    ["shopify_orders", "send_email"],
    ["search_docs", "shopify_search", "send_email"],
    ["slack_notify"],
    ["search_web", "send_email"],
]


def seed():
    create_tables()
    db = SessionLocal()

    try:
        # Create demo user
        user = db.query(User).filter(User.email == "demo@orstra.ai").first()
        if not user:
            user = User(
                id=uuid.uuid4(),
                email="demo@orstra.ai",
                hashed_password=hash_password("demo123"),
                full_name="Demo User",
            )
            db.add(user)
            db.commit()
            print(f"Created demo user: demo@orstra.ai / demo123")
        else:
            print("Demo user already exists")

        # Create 3 agents
        agent_configs = [
            {
                "name": "Support Reply Agent",
                "description": "Reads incoming customer support emails and replies using the knowledge base",
                "industry": "ecommerce",
                "status": "active",
                "trigger_type": "email",
                "trigger_config": {"inbox": "support@demo-store.com"},
                "tools_enabled": ["search_docs", "send_email"],
                "system_prompt": "You are a helpful customer support agent. Always be friendly and resolve issues quickly.",
                "guardrails": [
                    {"id": "r1", "type": "keyword_escalate", "keywords": ["refund", "legal", "lawsuit"], "action": "escalate"},
                    {"id": "r2", "type": "confidence_threshold", "threshold": 0.75, "action": "human_review"},
                ],
            },
            {
                "name": "Order Status Agent",
                "description": "Automatically looks up Shopify order status and sends tracking information to customers",
                "industry": "ecommerce",
                "status": "active",
                "trigger_type": "email",
                "trigger_config": {"inbox": "orders@demo-store.com"},
                "tools_enabled": ["shopify_orders", "send_email"],
                "system_prompt": "Look up order details and provide accurate shipping information. Be concise.",
                "guardrails": [
                    {"id": "r1", "type": "cost_limit", "max_usd": 0.05, "action": "stop_and_alert"},
                ],
            },
            {
                "name": "Weekly Report Agent",
                "description": "Generates a weekly sales and performance summary and posts it to Slack",
                "industry": "ecommerce",
                "status": "paused",
                "trigger_type": "schedule",
                "trigger_config": {"cron": "0 9 * * 1"},
                "tools_enabled": ["shopify_orders", "shopify_search", "slack_notify"],
                "system_prompt": "Generate a concise weekly performance report. Include key metrics and trends.",
                "guardrails": [],
            },
        ]

        agents = []
        for config in agent_configs:
            existing = db.query(Agent).filter(
                Agent.user_id == user.id,
                Agent.name == config["name"]
            ).first()

            if not existing:
                agent = Agent(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    updated_at=datetime.utcnow(),
                    **config,
                )
                db.add(agent)
                agents.append(agent)
                print(f"Created agent: {config['name']}")
            else:
                agents.append(existing)
                print(f"Agent already exists: {config['name']}")

        db.commit()

        # Create sample task runs
        existing_runs = db.query(TaskRun).filter(
            TaskRun.agent_id.in_([a.id for a in agents])
        ).count()

        if existing_runs < 20:
            statuses = ["completed"] * 14 + ["escalated"] * 3 + ["failed"] * 3
            random.shuffle(statuses)

            for i in range(20):
                agent = random.choice(agents[:2])  # Only active agents
                status = statuses[i]
                created_at = datetime.utcnow() - timedelta(
                    hours=random.randint(0, 72),
                    minutes=random.randint(0, 59),
                )

                run = TaskRun(
                    id=uuid.uuid4(),
                    agent_id=agent.id,
                    trigger_data={"from": f"customer{i}@example.com", "subject": "Order inquiry", "body": "Hi, where is my order?"},
                    status=status,
                    intent=random.choice(INTENTS),
                    confidence=round(random.uniform(0.65, 0.99), 2),
                    tools_called=random.choice(TOOLS),
                    ai_calls=[{"step": "plan", "cost_usd": round(random.uniform(0.001, 0.005), 4)}],
                    escalated=status == "escalated",
                    escalation_reason="Keyword 'refund' detected" if status == "escalated" else None,
                    output={"action_type": "send_email", "content": "Thank you for reaching out..."} if status == "completed" else {},
                    cost_usd=round(random.uniform(0.002, 0.015), 4),
                    duration_ms=random.randint(800, 4500),
                    error="OpenAI API timeout" if status == "failed" else None,
                    created_at=created_at,
                )
                db.add(run)

            db.commit()
            print(f"Created 20 sample task runs")
        else:
            print("Sample runs already exist")

        print("\nSeed complete!")
        print("Login: demo@orstra.ai / demo123")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
