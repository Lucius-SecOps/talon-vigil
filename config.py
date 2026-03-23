"""
TalonVigil Backend Configuration
Loaded from environment variables / .env file.
No Azure. No hardcoded secrets. Ever.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────────
    environment: str = "development"
    secret_key: str = "dev-secret-change-in-production"
    allowed_origins: list[str] = ["http://localhost:5173"]

    # ── Supabase ──────────────────────────────────────────────
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # ── Reputation APIs ───────────────────────────────────────
    google_safe_browsing_api_key: str = ""
    ipqualityscore_api_key: str = ""
    phishtank_app_key: str = ""

    # ── Queue ─────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── Scoring Thresholds (L8) ───────────────────────────────
    quarantine_threshold: int = 66
    suspicious_threshold: int = 31
    veto_threshold: int = 80        # Any Critical layer >= 80 = immediate quarantine

    # ── Layer 7 Behavioral ────────────────────────────────────
    behavioral_baseline_days: int = 90

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
