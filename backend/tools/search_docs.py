from tools.base import BaseTool
from utils.embeddings import embed_text
from utils.logger import get_logger

logger = get_logger(__name__)


class SearchDocsTool(BaseTool):
    name = "search_docs"
    description = (
        "Search the agent's knowledge base (uploaded documents) for relevant information. "
        "Use this tool when you need to find information from PDFs, text files, or other documents "
        "that have been uploaded to this agent. Returns the top 5 most relevant text passages. "
        "Input should be a natural language question or search query."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query to find relevant document passages",
            }
        },
        "required": ["query"],
    }

    def __init__(self, agent_id: str, db_session=None):
        self.agent_id = agent_id
        self.db_session = db_session

    def run(self, input: str) -> str:
        try:
            import json
            try:
                data = json.loads(input)
                query = data.get("query", input)
            except Exception:
                query = input

            if not self.db_session:
                return "No database connection available for document search."

            query_embedding = embed_text(query)

            from database.models import DocumentChunk
            from sqlalchemy import text

            result = self.db_session.execute(
                text(
                    """
                    SELECT content FROM document_chunks
                    WHERE agent_id = :agent_id
                    ORDER BY embedding <=> cast(:embedding as vector)
                    LIMIT 5
                    """
                ),
                {
                    "agent_id": self.agent_id,
                    "embedding": str(query_embedding),
                },
            )
            chunks = result.fetchall()

            if not chunks:
                return "No relevant documents found for this query."

            passages = [row[0] for row in chunks]
            return "\n\n---\n\n".join(passages)

        except Exception as e:
            logger.error("search_docs_error", error=str(e))
            return f"Document search failed: {str(e)}"
