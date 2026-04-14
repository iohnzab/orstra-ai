"""
Embeddings stub — vector search replaced with PostgreSQL full-text search.
Kept for compatibility but no longer loads any ML model.
"""

EMBEDDING_DIM = 384


def embed_text(text: str) -> list[float] | None:
    """Disabled — use PostgreSQL FTS instead."""
    return None


def embed_texts(texts: list[str]) -> list[None]:
    """Disabled — use PostgreSQL FTS instead."""
    return [None] * len(texts)


def calculate_embedding_cost(total_tokens: int) -> float:
    return 0.0
