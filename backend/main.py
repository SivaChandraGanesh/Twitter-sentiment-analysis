"""
main.py — FastAPI application entry point (modular architecture).
Registers all route modules and initializes the database on startup.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database.db import create_db_and_tables
from routes import upload, preprocess, sentiment, emotion, visualize, reports

# Rate limiting (optional — graceful fallback if slowapi not installed)
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    limiter = Limiter(default_limits=["60/minute"], key_func=get_remote_address)
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
    logger.info("Database ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Data Driven Emotion API",
    description="Modular NLP backend for Twitter Sentiment & Emotion Analysis.",
    version="2.0.0",
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

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload.router)
app.include_router(preprocess.router)
app.include_router(sentiment.router)
app.include_router(emotion.router)
app.include_router(visualize.router)
app.include_router(reports.router)


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
def health():
    """Simple liveness probe."""
    return {"status": "ok", "version": "2.0.0"}


# ── Dataset Preview (backward compat) ────────────────────────────────────────
@app.get("/api/dataset/preview", tags=["Upload"])
def dataset_preview():
    """
    Deprecated: preview is now returned on upload.
    Returns instruction to re-upload.
    """
    return {"message": "Upload a file via POST /api/upload to get a preview."}
