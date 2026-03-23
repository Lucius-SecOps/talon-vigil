"""
TalonVigil — FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from config import get_settings
from api.middleware.security import add_security_headers
from api.routers import health, auth, scan

logger = structlog.get_logger()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("TalonVigil API starting", environment=settings.environment)
    yield
    logger.info("TalonVigil API shutting down")


app = FastAPI(
    title="TalonVigil API",
    description="8-Layer Heuristic Email Security Engine",
    version="1.0.0",
    docs_url="/api/docs" if settings.environment != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)

# ── Security Headers ──────────────────────────────────────────
app.middleware("http")(add_security_headers)

# ── Routers ───────────────────────────────────────────────────
app.include_router(health.router, prefix="/api")
app.include_router(auth.router,   prefix="/api/auth",  tags=["auth"])
app.include_router(scan.router,   prefix="/api/scan",  tags=["scan"])
