import json
import httpx
from tools.base import BaseTool
from utils.logger import get_logger

logger = get_logger(__name__)


class UpdateCRMTool(BaseTool):
    name = "update_crm"
    description = (
        "Update a HubSpot CRM contact record with new information. "
        "Use when you need to log an interaction, update contact properties, add a note, "
        "or record the outcome of a customer conversation. "
        "Input should include the contact email and properties to update."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "email": {"type": "string", "description": "Contact email address"},
            "properties": {
                "type": "object",
                "description": "Key-value pairs of CRM properties to update",
            },
            "note": {"type": "string", "description": "Optional note to add to the contact timeline"},
        },
        "required": ["email"],
    }

    def __init__(self, hubspot_creds: dict | None = None, dry_run: bool = False):
        self.creds = hubspot_creds or {}
        self.dry_run = dry_run

    def run(self, input: str) -> str:
        try:
            try:
                data = json.loads(input)
            except Exception:
                return "Invalid input: expected JSON with email field."

            email = data.get("email", "")
            properties = data.get("properties", {})
            note = data.get("note", "")

            if not email:
                return "Contact email is required."

            if self.dry_run:
                return f"[DRY RUN] Would update CRM contact {email} with: {json.dumps(properties)}"

            api_key = self.creds.get("api_key", "")
            if not api_key:
                return f"[MOCK] CRM updated for {email}: {json.dumps(properties)}"

            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

            search_url = "https://api.hubapi.com/crm/v3/objects/contacts/search"
            search_payload = {"filterGroups": [{"filters": [{"propertyName": "email", "operator": "EQ", "value": email}]}]}

            with httpx.Client() as client:
                search_response = client.post(search_url, headers=headers, json=search_payload, timeout=10)
                search_data = search_response.json()

                results = search_data.get("results", [])
                if results:
                    contact_id = results[0]["id"]
                    update_url = f"https://api.hubapi.com/crm/v3/objects/contacts/{contact_id}"
                    client.patch(update_url, headers=headers, json={"properties": properties}, timeout=10)

                    if note:
                        note_url = "https://api.hubapi.com/crm/v3/objects/notes"
                        note_payload = {
                            "properties": {"hs_note_body": note, "hs_timestamp": "now"},
                            "associations": [{"to": {"id": contact_id}, "types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 202}]}],
                        }
                        client.post(note_url, headers=headers, json=note_payload, timeout=10)

                    return f"CRM contact {email} updated successfully."
                else:
                    return f"Contact {email} not found in CRM."

        except Exception as e:
            logger.error("update_crm_error", error=str(e))
            return f"CRM update failed: {str(e)}"
