import httpx
from connectors.base_connector import BaseConnector


class ShopifyConnector(BaseConnector):
    service = "shopify"
    display_name = "Shopify"

    def verify(self, credentials: dict) -> bool:
        try:
            shop_url = credentials.get("shop_url", "")
            api_key = credentials.get("admin_api_key", "")
            if not shop_url or not api_key:
                return False
            url = f"https://{shop_url}/admin/api/2024-01/shop.json"
            headers = {"X-Shopify-Access-Token": api_key}
            with httpx.Client(timeout=10) as client:
                response = client.get(url, headers=headers)
                return response.status_code == 200
        except Exception:
            return False

    def get_credential_fields(self) -> list[dict]:
        return [
            {"name": "shop_url", "label": "Store URL", "type": "text", "required": True,
             "placeholder": "mystore.myshopify.com"},
            {"name": "admin_api_key", "label": "Admin API Key", "type": "password", "required": True},
        ]
