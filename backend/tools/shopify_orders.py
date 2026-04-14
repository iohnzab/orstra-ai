import json
import httpx
from tools.base import BaseTool
from utils.logger import get_logger

logger = get_logger(__name__)


class ShopifyOrdersTool(BaseTool):
    name = "shopify_orders"
    description = (
        "Look up Shopify order status and details by order number or customer email. "
        "Use when a customer asks 'where is my order?', 'what's the status of order #1234?', "
        "or when you need to retrieve order details for customer service. "
        "Returns order status, tracking info, items ordered, and estimated delivery."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "order_number": {"type": "string", "description": "Order number (e.g. 1001)"},
            "customer_email": {"type": "string", "description": "Customer email to look up orders"},
        },
    }

    def __init__(self, shopify_creds: dict | None = None):
        self.creds = shopify_creds or {}

    def run(self, input: str) -> str:
        try:
            try:
                data = json.loads(input)
            except Exception:
                data = {"order_number": input}

            order_number = data.get("order_number", "")
            customer_email = data.get("customer_email", "")

            shop_url = self.creds.get("shop_url", "")
            api_key = self.creds.get("admin_api_key", "")

            if not shop_url or not api_key:
                return f"[MOCK] Order #{order_number or 'search'}: Status: Shipped. Tracking: 1Z999AA10123456784. Estimated delivery: 2-3 business days. Items: 2x Product A, 1x Product B."

            url = f"https://{shop_url}/admin/api/2024-01/orders.json"
            headers = {"X-Shopify-Access-Token": api_key}
            params = {}
            if order_number:
                params["name"] = f"#{order_number}"
            elif customer_email:
                params["email"] = customer_email

            with httpx.Client() as client:
                response = client.get(url, headers=headers, params=params, timeout=10)
                response.raise_for_status()
                orders_data = response.json()

            orders = orders_data.get("orders", [])
            if not orders:
                return f"No orders found for the provided details."

            order = orders[0]
            fulfillments = order.get("fulfillments", [])
            tracking = "Not yet shipped"
            if fulfillments:
                tracking_numbers = fulfillments[0].get("tracking_numbers", [])
                tracking = ", ".join(tracking_numbers) if tracking_numbers else "Shipped (no tracking)"

            items = [f"{li['quantity']}x {li['title']}" for li in order.get("line_items", [])]

            return (
                f"Order #{order.get('order_number')}\n"
                f"Status: {order.get('fulfillment_status', 'unfulfilled').title()}\n"
                f"Financial: {order.get('financial_status', 'N/A').title()}\n"
                f"Tracking: {tracking}\n"
                f"Items: {', '.join(items)}\n"
                f"Total: ${order.get('total_price', 'N/A')}"
            )

        except Exception as e:
            logger.error("shopify_orders_error", error=str(e))
            return f"Order lookup failed: {str(e)}"
