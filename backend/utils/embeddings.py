from utils.logger import get_logger

logger = get_logger(__name__)

# Lazy-loaded model — downloaded once on first use (~90MB)
_model = None
EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 output dimension


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("loading_embedding_model", model="all-MiniLM-L6-v2")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("embedding_model_loaded")
    return _model


def embed_text(text: str) -> list[float]:
    """Generate embedding for a single text string."""
    model = _get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts in one batch."""
    model = _get_model()
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return [e.tolist() for e in embeddings]


def calculate_embedding_cost(total_tokens: int) -> float:
    """Embeddings are free (local model) — always returns 0."""
    return 0.0
