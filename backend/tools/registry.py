from tools.base import BaseTool
from tools.search_docs import SearchDocsTool
from tools.send_email import SendEmailTool
from tools.search_web import SearchWebTool
from tools.shopify_search import ShopifySearchTool
from tools.shopify_orders import ShopifyOrdersTool
from tools.slack_notify import SlackNotifyTool
from tools.update_crm import UpdateCRMTool
from tools.custom_code import CustomCodeTool
from utils.encryption import decrypt
from utils.logger import get_logger

logger = get_logger(__name__)

TOOL_REGISTRY_MAP = {
    "search_docs": SearchDocsTool,
    "send_email": SendEmailTool,
    "search_web": SearchWebTool,
    "shopify_search": ShopifySearchTool,
    "shopify_orders": ShopifyOrdersTool,
    "slack_notify": SlackNotifyTool,
    "update_crm": UpdateCRMTool,
    "custom_code": CustomCodeTool,
}

ALL_TOOL_DEFINITIONS = [
    {
        "name": "search_docs",
        "description": "Search uploaded knowledge base documents",
        "category": "Data Sources",
        "icon": "FileText",
        "requires_connector": None,
    },
    {
        "name": "search_web",
        "description": "Search the web for current information",
        "category": "Data Sources",
        "icon": "Globe",
        "requires_connector": None,
    },
    {
        "name": "shopify_search",
        "description": "Search Shopify product catalog",
        "category": "Data Sources",
        "icon": "ShoppingBag",
        "requires_connector": "shopify",
    },
    {
        "name": "shopify_orders",
        "description": "Look up Shopify order status",
        "category": "Data Sources",
        "icon": "Package",
        "requires_connector": "shopify",
    },
    {
        "name": "send_email",
        "description": "Send email replies or notifications",
        "category": "Actions",
        "icon": "Mail",
        "requires_connector": "gmail",
    },
    {
        "name": "slack_notify",
        "description": "Post messages to Slack channels",
        "category": "Actions",
        "icon": "MessageSquare",
        "requires_connector": "slack",
    },
    {
        "name": "update_crm",
        "description": "Update HubSpot CRM contacts",
        "category": "Actions",
        "icon": "Users",
        "requires_connector": "hubspot",
    },
    {
        "name": "custom_code",
        "description": "Run custom Python code snippets",
        "category": "Analysis",
        "icon": "Code",
        "requires_connector": None,
    },
]


class ToolRegistry:
    def get_tools_for_agent(
        self,
        agent_id: str,
        tools_enabled: list[str],
        connectors: list,
        db_session=None,
        dry_run: bool = False,
    ) -> list[BaseTool]:
        """
        Given an agent config and its connected services,
        return the right tool instances with credentials injected.
        """
        connector_map: dict[str, dict] = {}
        for connector in connectors:
            try:
                creds = decrypt(connector.credentials)
                connector_map[connector.service] = creds
            except Exception as e:
                logger.warning("connector_decrypt_failed", service=connector.service, error=str(e))
                connector_map[connector.service] = {}

        tools: list[BaseTool] = []

        for tool_name in tools_enabled:
            if tool_name not in TOOL_REGISTRY_MAP:
                logger.warning("unknown_tool", tool_name=tool_name)
                continue

            try:
                if tool_name == "search_docs":
                    tools.append(SearchDocsTool(agent_id=agent_id, db_session=db_session))

                elif tool_name == "send_email":
                    creds = connector_map.get("gmail", {})
                    tools.append(SendEmailTool(gmail_creds=creds, dry_run=dry_run))

                elif tool_name == "search_web":
                    tools.append(SearchWebTool())

                elif tool_name == "shopify_search":
                    creds = connector_map.get("shopify", {})
                    tools.append(ShopifySearchTool(shopify_creds=creds))

                elif tool_name == "shopify_orders":
                    creds = connector_map.get("shopify", {})
                    tools.append(ShopifyOrdersTool(shopify_creds=creds))

                elif tool_name == "slack_notify":
                    creds = connector_map.get("slack", {})
                    tools.append(SlackNotifyTool(slack_creds=creds, dry_run=dry_run))

                elif tool_name == "update_crm":
                    creds = connector_map.get("hubspot", {})
                    tools.append(UpdateCRMTool(hubspot_creds=creds, dry_run=dry_run))

                elif tool_name == "custom_code":
                    tools.append(CustomCodeTool())

            except Exception as e:
                logger.error("tool_init_failed", tool_name=tool_name, error=str(e))

        return tools
