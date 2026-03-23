"""
Layer 4 — Linguistic Pressure Mapping
Severity: High | Multiplier: 1.4x | Veto-Eligible: No

Rule-based weighted scoring (v1). ML classifier planned for v2.
Detects the 5 social engineering pressure archetypes.
"""
import re
from utils.scoring import LayerScore

# ── Pressure Archetype Libraries ──────────────────────────────
# Each tuple: (pattern, weight, human-readable signal)

URGENCY_PATTERNS = [
    (r"act (now|immediately|today|within \d+)", 15, "Urgency trigger: 'Act now/immediately'"),
    (r"(expires?|expiring) (today|tonight|in \d+ hours?)", 15, "Urgency trigger: expiration deadline"),
    (r"(final|last) (notice|warning|reminder|chance)", 20, "Urgency trigger: 'Final notice/warning'"),
    (r"account (will be |is being )?(suspended|disabled|terminated|locked)", 25, "Urgency trigger: account suspension threat"),
    (r"immediate (action|response|attention) (required|needed)", 20, "Urgency trigger: 'Immediate action required'"),
    (r"respond within \d+", 15, "Urgency trigger: forced response window"),
]

AUTHORITY_PATTERNS = [
    (r"\birs\b|\binternal revenue service\b", 30, "Authority: IRS impersonation"),
    (r"\b(fbi|federal bureau|ssa|social security)\b", 30, "Authority: Federal agency impersonation"),
    (r"\b(ceo|chief executive|president|director|legal (team|department))\b", 20, "Authority: Executive/legal authority claim"),
    (r"(it|security) (department|team|helpdesk|support)", 20, "Authority: IT/Security department impersonation"),
    (r"(official|mandatory|required) (notice|communication|update)", 15, "Authority: Official mandate framing"),
]

FEAR_PATTERNS = [
    (r"(legal|law(suit)?|court|litigation|criminal) (action|proceedings?|charges?)", 30, "Fear: Legal threat"),
    (r"(your|account) (has been|was) (compromised|breached|hacked|accessed)", 25, "Fear: Security breach claim"),
    (r"(arrest|warrant|prosecution|penalty|fine) (if|unless|will)", 30, "Fear: Arrest/penalty threat"),
    (r"(unusual|suspicious|unauthorized) (activity|access|login|sign.?in)", 20, "Fear: Unauthorized access claim"),
]

SCARCITY_PATTERNS = [
    (r"limited (time|offer|availability)", 10, "Scarcity: Limited time/availability"),
    (r"only \d+ (spots?|seats?|remaining|left)", 10, "Scarcity: Limited quantity"),
    (r"exclusively (for you|yours)", 10, "Scarcity: Exclusive framing"),
    (r"(offer|deal) expires?", 10, "Scarcity: Offer expiration"),
]

RECIPROCITY_PATTERNS = [
    (r"(you (have|'ve) won|congratulations.*prize|winner)", 25, "Reciprocity: Prize/winner claim"),
    (r"(gift card|amazon card|itunes card|google play card)", 30, "Reciprocity: Gift card lure"),
    (r"(unclaimed|pending) (funds?|refund|inheritance|transfer)", 25, "Reciprocity: Unclaimed funds hook"),
    (r"(tax refund|overpayment|reimbursement) (of|for) \$", 20, "Reciprocity: Financial refund lure"),
]

ALL_ARCHETYPES = [
    ("Urgency",      URGENCY_PATTERNS),
    ("Authority",    AUTHORITY_PATTERNS),
    ("Fear",         FEAR_PATTERNS),
    ("Scarcity",     SCARCITY_PATTERNS),
    ("Reciprocity",  RECIPROCITY_PATTERNS),
]

# Whitelisted domains — suppress L4 scoring for legitimate senders
WHITELIST_DOMAINS = {
    "hospital.org", "healthcare.gov", "fema.gov", "weather.gov",
}


async def analyze_linguistics(payload) -> LayerScore:
    signals = []
    total_score = 0.0

    from_domain = payload.from_address.split("@")[-1].lower() if "@" in payload.from_address else ""
    if from_domain in WHITELIST_DOMAINS:
        return LayerScore(layer=4, name="Linguistic Pressure Mapping",
                          raw_score=0.0, signals=["Sender is in whitelist — linguistic scoring suppressed."])

    text = (payload.subject + " " + payload.body_text).lower()
    archetypes_fired = 0

    for archetype_name, patterns in ALL_ARCHETYPES:
        archetype_score = 0.0
        for pattern, weight, signal_label in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                archetype_score += weight
                signals.append(f"[{archetype_name}] {signal_label}")

        if archetype_score > 0:
            archetypes_fired += 1
            total_score += archetype_score

    # Amplify score when multiple archetypes fire — stacked manipulation
    if archetypes_fired >= 3:
        total_score *= 1.3
        signals.append(f"Score amplified: {archetypes_fired} pressure archetypes detected simultaneously.")

    total_score = min(total_score, 100.0)

    if not signals:
        signals.append("No linguistic manipulation patterns detected.")

    return LayerScore(layer=4, name="Linguistic Pressure Mapping",
                      raw_score=total_score, signals=signals)
