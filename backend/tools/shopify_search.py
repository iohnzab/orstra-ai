import json
import httpx
from tools.base import BaseTool
from utils.logger import get_logger

logger = get_logger(__name__)


class ShopifySearchTool(BaseTool):
    name = "shopify_search"
    description = (
        "Search the Shopify product catalog for products matching a query. "
        "Use when a customer asks about products, availability, pricing, or product details. "
        "Returns product names, descriptions, prices, and availability status."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Product search query"}
        },
        "required": ["query"],
    }

    def __init__(self, shopify_creds: dict | None = None):
        self.creds = shopify_creds or {}

    def run(self, input: str) -> str:
        try:
            try:
                data = json.loads(input)
                query = data.get("query", input)
            except Exception:
                query = input

            shop_url = self.creds.get("shop_url", "")
            api_key = self.creds.get("admin_api_key", "")

            if not shop_url or not api_key:
                return f"[MOCK] Shopify search for '{query}': Found 3 products matching your query. Product A: $29.99 (in stock), Product B: $49.99 (in stock), Product C: $19.99 (out of stock)."

            url = f"https://{shop_url}/admin/api/2024-01/products.json"
            headers = {"X-Shopify-Access-Token": api_key}
            params = {"title": query, "limit": 5}

            with httpx.Client() as client:
                response = client.get(url, headers=headers, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()

            products = data.get("products", [])
            if not products:
                return f"No products found matching: {query}"

            results = []
            for p in products:
                variant = p.get("variants", [{}])[0]
                price = variant.get("price", "N/A")
                inventory = variant.get("inventory_quantity", 0)
                status = "In Stock" if inventory > 0 else "Out of Stock"
                results.append(f"**{p['title']}** — ${price} ({status})\n{p.get('body_html', '')[:200]}")

            return "\n\n".join(results)

        except Exception as e:
            logger.error("shopify_search_error", error=str(e))
            return f"Shopify search failed: {str(e)}"
