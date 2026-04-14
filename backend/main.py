from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from config import get_settings
from database.connection import create_tables
from utils.logger import setup_logging, get_logger
from api.auth import router as auth_router
from api.agents import router as agents_router
from api.connectors import router as connectors_router
from api.runs import router as runs_router
from api.test_run import router as test_router
from api.documents import router as documents_router
from api.settings import router as settings_router
from tools.registry import ALL_TOOL_DEFINITIONS

settings = get_settings()
setup_logging(debug=settings.debug)
logger = get_logger(__name__)

app = FastAPI(
    title="Orstra AI",
    description="No-code AI agent platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = int((time.time() - start) * 1000)
    logger.info("http_request", method=request.method, path=request.url.path, status=response.status_code, duration_ms=duration)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "code": "INTERNAL_ERROR", "details": {}},
    )


@app.on_event("startup")
async def startup():
    logger.info("app_starting")
    create_tables()
    logger.info("app_started")


app.include_router(auth_router)
app.include_router(agents_router)
app.include_router(connectors_router)
app.include_router(runs_router)
app.include_router(test_router)
app.include_router(documents_router)
app.include_router(settings_router)


@app.get("/")
def root():
    return {"service": "Orstra AI API", "version": "0.1.0", "status": "ok"}


@app.get("/tools")
def list_tools():
    """List all available tools."""
    return ALL_TOOL_DEFINITIONS


@app.get("/health")
def health():
    return {"status": "healthy"}
