import json
import httpx
from tools.base import BaseTool
from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)


class SearchWebTool(BaseTool):
    name = "search_web"
    description = (
        "Search the web for current information using Google Custom Search. "
        "Use this when you need up-to-date information that may not be in the knowledge base, "
        "such as current prices, news, product availability, or recent events. "
        "Returns up to 5 search result snippets with titles and URLs."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "The search query"}
        },
        "required": ["query"],
    }

    def __init__(self):
        self.settings = get_settings()

    def run(self, input: str) -> str:
        try:
            try:
                data = json.loads(input)
                query = data.get("query", input)
            except Exception:
                query = input

            api_key = self.settings.google_custom_search_api_key
            engine_id = self.settings.google_search_engine_id

            if not api_key or not engine_id:
                return f"[MOCK WEB SEARCH] Results for '{query}': No Google Custom Search API key configured. In production, this would return real search results."

            url = "https://www.googleapis.com/customsearch/v1"
            params = {"key": api_key, "cx": engine_id, "q": query, "num": 5}

            with httpx.Client() as client:
                response = client.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()

            items = data.get("items", [])
            if not items:
                return f"No search results found for: {query}"

            results = []
            for item in items:
                results.append(f"**{item.get('title', 'No title')}**\n{item.get('snippet', '')}\nURL: {item.get('link', '')}")

            return "\n\n".join(results)

        except Exception as e:
            logger.error("search_web_error", error=str(e))
            return f"Web search failed: {str(e)}"
