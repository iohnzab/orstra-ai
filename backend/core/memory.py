from sqlalchemy.orm import Session
from sqlalchemy import text
from utils.embeddings import embed_text
from utils.logger import get_logger

logger = get_logger(__name__)


def search_memory(
    db: Session,
    agent_id: str,
    query: str,
    limit: int = 5,
) -> list[str]:
    """Search pgvector for similar document chunks."""
    try:
        embedding = embed_text(query)
        result = db.execute(
            text(
                """
                SELECT content, 1 - (embedding <=> cast(:embedding as vector)) as similarity
                FROM document_chunks
                WHERE agent_id = :agent_id
                ORDER BY embedding <=> cast(:embedding as vector)
                LIMIT :limit
                """
            ),
            {"agent_id": agent_id, "embedding": str(embedding), "limit": limit},
        )
        rows = result.fetchall()
        return [row[0] for row in rows]
    except Exception as e:
        logger.error("memory_search_error", error=str(e))
        return []


def store_run_context(db: Session, agent_id: str, run_id: str, content: str) -> None:
    """Store a run summary in memory for future reference."""
    pass  # Future enhancement: store run summaries as searchable context
