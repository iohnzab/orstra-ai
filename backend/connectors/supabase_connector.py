import httpx
from connectors.base_connector import BaseConnector


class SupabaseConnector(BaseConnector):
    service = "supabase"
    display_name = "Supabase"

    def verify(self, credentials: dict) -> bool:
        try:
            project_url = credentials.get("project_url", "")
            api_key = credentials.get("api_key", "")
            if not project_url or not api_key:
                return False
            url = f"{project_url}/rest/v1/"
            headers = {"apikey": api_key, "Authorization": f"Bearer {api_key}"}
            with httpx.Client(timeout=10) as client:
                response = client.get(url, headers=headers)
                return response.status_code in (200, 401)  # 401 means server reached
        except Exception:
            return False

    def get_credential_fields(self) -> list[dict]:
        return [
            {"name": "project_url", "label": "Project URL", "type": "text", "required": True,
             "placeholder": "https://xxx.supabase.co"},
            {"name": "api_key", "label": "Service Role Key", "type": "password", "required": True},
        ]
