"""
Composite Scoring Utilities
Salvaged and adapted from adaptive_threat_scoring.py.
Used exclusively by Layer 8.
"""
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class RiskLevel(Enum):
    SAFE       = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    QUARANTINE = "QUARANTINE"
    VETO       = "VETO"


# ── Layer weight multipliers (locked in Draft 2) ───────────────
LAYER_WEIGHTS = {
    1: 1.8,   # Envelope Analysis      — Critical
    2: 1.3,   # Sender Reputation      — High
    3: 1.2,   # Header Forensics       — High
    4: 1.4,   # Linguistic Pressure    — High
    5: 2.0,   # Identity Impersonation — Critical (highest)
    6: 1.9,   # Link & Payload         — Critical
    7: 1.1,   # Behavioral Context     — Medium (low until 90d baseline)
}

# Critical layers eligible for veto override
VETO_ELIGIBLE_LAYERS = {1, 5, 6}

# Veto threshold: any critical layer scoring >= this = immediate quarantine
VETO_THRESHOLD = 80.0


@dataclass
class LayerScore:
    """Score output from a single detection layer."""
    layer:      int
    name:       str
    raw_score:  float               # 0-100 from the layer
    signals:    list[str] = field(default_factory=list)

    @property
    def multiplier(self) -> float:
        return LAYER_WEIGHTS.get(self.layer, 1.0)

    @property
    def weighted_score(self) -> float:
        return round(self.raw_score * self.multiplier, 2)

    @property
    def veto_triggered(self) -> bool:
        return (
            self.layer in VETO_ELIGIBLE_LAYERS
            and self.raw_score >= VETO_THRESHOLD
        )


def compute_composite_score(layer_scores: list[LayerScore]) -> float:
    """
    Normalize weighted sum to 0-100 composite score.
    Formula: Σ(score_n × weight_n) ÷ Σ(100 × weight_n) × 100

    Adapted from: adaptive_threat_scoring.py::AdaptiveThreatScoring._combine_scores()
    """
    if not layer_scores:
        return 0.0

    weighted_sum = sum(ls.weighted_score for ls in layer_scores)
    max_possible = sum(100 * LAYER_WEIGHTS[ls.layer] for ls in layer_scores)

    if max_possible == 0:
        return 0.0

    return round((weighted_sum / max_possible) * 100, 2)


def score_to_risk_level(
    composite: float,
    veto_triggered: bool,
    quarantine_threshold: int = 66,
    suspicious_threshold: int = 31,
) -> RiskLevel:
    """
    Map composite score to classification.
    Adapted from: adaptive_threat_scoring.py::AdaptiveThreatScoring._score_to_risk_level()
    """
    if veto_triggered:
        return RiskLevel.VETO
    if composite >= quarantine_threshold:
        return RiskLevel.QUARANTINE
    if composite >= suspicious_threshold:
        return RiskLevel.SUSPICIOUS
    return RiskLevel.SAFE


def generate_reasoning(
    layer_scores: list[LayerScore],
    risk_level: RiskLevel,
) -> str:
    """
    Generate a single plain-language verdict sentence for EAA output.
    Adapted from: adaptive_threat_scoring.py::AdaptiveThreatScoring._generate_reasoning()
    """
    fired = [ls for ls in layer_scores if ls.raw_score > 30]

    if risk_level == RiskLevel.VETO:
        veto_layer = next(
            (ls for ls in layer_scores if ls.veto_triggered), None
        )
        layer_name = veto_layer.name if veto_layer else "a critical layer"
        return (
            f"Quarantined immediately: {layer_name} triggered a veto-level "
            f"signal ({veto_layer.raw_score:.0f}/100) that indicates a high-confidence threat."
        )

    if risk_level == RiskLevel.QUARANTINE:
        layer_names = ", ".join(ls.name for ls in fired[:3])
        return (
            f"This email scored {compute_composite_score(layer_scores):.0f}/100 "
            f"and was quarantined. Threat signals detected in: {layer_names}."
        )

    if risk_level == RiskLevel.SUSPICIOUS:
        layer_names = ", ".join(ls.name for ls in fired[:2])
        return (
            f"This email shows some suspicious signals ({layer_names}) "
            f"but did not meet the quarantine threshold. Review before acting."
        )

    return "No significant threat signals detected across all 8 layers. Safe to deliver."


RISK_TO_ACTION = {
    RiskLevel.SAFE:       "deliver",
    RiskLevel.SUSPICIOUS: "warn",
    RiskLevel.QUARANTINE: "quarantine",
    RiskLevel.VETO:       "quarantine",
}
