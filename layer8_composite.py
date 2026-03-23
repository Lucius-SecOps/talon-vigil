"""
Layer 8 — Composite Threat Scoring & EAA Gate
This is not a detection layer. It is the verdict layer.

Takes raw scores from L1-L7, applies locked weight multipliers,
computes composite score, applies veto logic, and produces
the full EAA threat report card.
"""
import uuid
from utils.scoring import (
    LayerScore,
    RiskLevel,
    compute_composite_score,
    score_to_risk_level,
    generate_reasoning,
    RISK_TO_ACTION,
)
from config import get_settings

settings = get_settings()


def compute_composite(layer_scores: list[LayerScore]) -> dict:
    """
    Run the EAA gate. Returns the full threat report dict
    matching the ScanResponse schema.
    """
    # ── Check for veto override ────────────────────────────────
    veto_triggered = any(ls.veto_triggered for ls in layer_scores)

    # ── Compute composite score ────────────────────────────────
    composite = compute_composite_score(layer_scores)

    # ── Classify ───────────────────────────────────────────────
    risk_level = score_to_risk_level(
        composite=composite,
        veto_triggered=veto_triggered,
        quarantine_threshold=settings.quarantine_threshold,
        suspicious_threshold=settings.suspicious_threshold,
    )

    # ── Generate plain-language verdict ───────────────────────
    summary = generate_reasoning(layer_scores, risk_level)

    # ── Build EAA layer breakdown ──────────────────────────────
    layers_output = [
        {
            "layer":      ls.layer,
            "name":       ls.name,
            "score":      ls.raw_score,
            "multiplier": ls.multiplier,
            "weighted":   ls.weighted_score,
            "signals":    ls.signals,
            "veto":       ls.veto_triggered,
        }
        for ls in layer_scores
    ]

    return {
        "scan_id":         str(uuid.uuid4()),
        "composite_score": composite,
        "classification":  risk_level.value,
        "veto_triggered":  veto_triggered,
        "action":          RISK_TO_ACTION[risk_level],
        "layers":          layers_output,
        "summary":         summary,
    }
