"""
Security Headers Middleware — FastAPI port of security_headers.py
Ported from the original Flask/Talisman implementation.
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import secrets


async def add_security_headers(request: Request, call_next) -> Response:
    """Add comprehensive security headers to all responses."""
    response = await call_next(request)

    # Prevent MIME sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"

    # Clickjacking protection
    response.headers["X-Frame-Options"] = "DENY"

    # Legacy XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"

    # Referrer policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Remove server fingerprint
    response.headers.pop("server", None)

    # HSTS (production only — enforced at Vercel/Cloudflare level in prod)
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains; preload"
    )

    # Permissions policy — deny all sensor APIs
    response.headers["Permissions-Policy"] = (
        "accelerometer=(), camera=(), geolocation=(), "
        "gyroscope=(), magnetometer=(), microphone=(), "
        "payment=(), usb=()"
    )

    # Cache control on sensitive API endpoints
    if request.url.path.startswith("/api/") and not request.url.path.startswith("/api/health"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"

    return response


def generate_nonce() -> str:
    """Generate a cryptographically secure nonce for CSP."""
    return secrets.token_urlsafe(16)
