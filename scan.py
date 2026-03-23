"""
Scan Router — /api/scan
Accepts an email payload, runs it through the 8-layer engine,
returns a full EAA threat report.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
import structlog

from engine.layer1_envelope import analyze_envelope
from engine.layer2_reputation import analyze_reputation
from engine.layer3_headers import analyze_headers
from engine.layer4_linguistic import analyze_linguistics
from engine.layer5_impersonation import analyze_impersonation
from engine.layer6_links import analyze_links
from engine.layer7_behavioral import analyze_behavioral
from engine.layer8_composite import compute_composite
from models.scan import ScanRecord
from config import get_settings

logger = structlog.get_logger()
router = APIRouter()
settings = get_settings()


# ── Request / Response Models ──────────────────────────────────
class EmailScanRequest(BaseModel):
    """
    Raw email data submitted for scanning.
    Data contract — must match frontend payload exactly.
    """
    raw_headers:   str
    from_address:  str
    from_name:     Optional[str] = None
    reply_to:      Optional[str] = None
    subject:       str
    body_text:     str
    body_html:     Optional[str] = None
    attachments:   list[str] = []       # List of attachment filenames
    user_id:       str                  # Supabase user UUID


class LayerResult(BaseModel):
    layer:       int
    name:        str
    score:       float                  # 0-100
    multiplier:  float
    weighted:    float
    signals:     list[str]             # Human-readable EAA explanations
    veto:        bool = False


class ScanResponse(BaseModel):
    scan_id:         str
    composite_score: float
    classification:  str               # SAFE / SUSPICIOUS / QUARANTINE
    veto_triggered:  bool
    action:          str               # deliver / warn / quarantine
    layers:          list[LayerResult]
    summary:         str               # One-sentence plain-language verdict


# ── Endpoint ───────────────────────────────────────────────────
@router.post("/", response_model=ScanResponse)
async def scan_email(payload: EmailScanRequest):
    """
    Run an email through all 8 layers and return the full EAA threat report.
    This is the core pipeline. All layers are run in sequence.
    Layer 8 computes the weighted composite and applies veto logic.
    """
    log = logger.bind(user_id=payload.user_id, from_address=payload.from_address)
    log.info("scan_started")

    try:
        # ── Run all 7 detection layers ─────────────────────────
        l1 = await analyze_envelope(payload)
        l2 = await analyze_reputation(payload)
        l3 = await analyze_headers(payload)
        l4 = await analyze_linguistics(payload)
        l5 = await analyze_impersonation(payload)
        l6 = await analyze_links(payload)
        l7 = await analyze_behavioral(payload)

        layer_results = [l1, l2, l3, l4, l5, l6, l7]

        # ── Layer 8: Composite + EAA output ────────────────────
        result = compute_composite(layer_results)

        log.info(
            "scan_complete",
            composite=result["composite_score"],
            classification=result["classification"],
            veto=result["veto_triggered"],
        )

        return ScanResponse(**result)

    except Exception as e:
        log.error("scan_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Scan pipeline failed. Please retry.",
        )
