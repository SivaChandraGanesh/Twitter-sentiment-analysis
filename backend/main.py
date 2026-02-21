"""
main.py — FastAPI application entry point (real-time modular architecture).
Registers all route modules, WebSocket streaming, and initializes the database on startup.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database.db import create_db_and_tables
from routes import upload, preprocess, sentiment, emotion, visualize, reports
from routes import stream  # Real-time WebSocket + stream control

# Rate limiting (optional — graceful fallback if slowapi not installed)
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    limiter = Limiter(default_limits=["120/minute"], key_func=get_remote_address)
    _rate_limiting_enabled = True
except ImportError:
    limiter = None
    _rate_limiting_enabled = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB & tables on startup."""
    logger.info("Starting up — initializing database...")
    create_db_and_tables()
    logger.info("Database ready. Real-time stream ready (start via POST /api/stream/start).")
    yield
    # Ensure stream is stopped on shutdown
    from services.stream_service import stop_stream, is_running
    if is_running():
        await stop_stream()
    logger.info("Shutting down.")


app = FastAPI(
    title="Data Driven Emotion API — Real-Time",
    description="Real-time NLP backend for Sentiment & Emotion Analysis with WebSocket streaming.",
    version="3.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers (existing ones self-declare prefix="/api") ────────────────────────
app.include_router(upload.router)
app.include_router(preprocess.router)
app.include_router(sentiment.router)
app.include_router(emotion.router)
app.include_router(visualize.router)
app.include_router(reports.router)

# ── Real-Time Stream Router ──────────────────────────────────────────────────
# stream.py has NO prefix in its APIRouter, so we add /api here for REST routes.
# The WebSocket endpoint is at /ws/live (handled inside routes/stream.py directly).
app.include_router(stream.router, prefix="/api", tags=["Stream"])



# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
def health():
    """Simple liveness probe."""
    from services.stream_service import is_running, get_session_stats
    from ws_manager import manager
    return {
        "status": "ok",
        "version": "3.0.0",
        "stream_running": is_running(),
        "ws_clients": manager.client_count,
        "session_stats": get_session_stats(),
    }


@app.get("/api/dataset/preview", tags=["Upload"])
def dataset_preview():
    return {"message": "Upload a file via POST /api/upload to get a preview."}
