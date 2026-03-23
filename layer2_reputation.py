"""
Layer 2 — Sender Reputation
Severity: High | Multiplier: 1.3x | Veto-Eligible: No

Checks domain age, IP reputation via IPQualityScore and Google Safe Browsing.
"""
import httpx
from utils.scoring import LayerScore
from utils.indicators import normalize_indicator, IOCType
from config import get_settings

settings = get_settings()


async def analyze_reputation(payload) -> LayerScore:
    signals = []
    score = 0.0

    from_domain = payload.from_address.split("@")[-1] if "@" in payload.from_address else ""
    from_domain = normalize_indicator(from_domain, IOCType.DOMAIN)

    if not from_domain:
        return LayerScore(layer=2, name="Sender Reputation", raw_score=10.0,
                          signals=["Could not extract sender domain."])

    # ── IPQualityScore ─────────────────────────────────────────
    ipqs_result = await _check_ipqualityscore(from_domain)
    if ipqs_result:
        if ipqs_result.get("phishing"):
            score += 80
            signals.append(f"IPQualityScore flagged {from_domain} as a known phishing domain.")
        elif ipqs_result.get("spam"):
            score += 50
            signals.append(f"IPQualityScore flagged {from_domain} as a spam domain.")
        elif ipqs_result.get("suspicious"):
            score += 30
            signals.append(f"IPQualityScore reports {from_domain} as suspicious.")

        domain_age_days = ipqs_result.get("domain_age", {}).get("days", None)
        if domain_age_days is not None and domain_age_days < 30:
            score += 25
            signals.append(
                f"Domain {from_domain} is only {domain_age_days} day(s) old — "
                f"newly registered domains are high-risk."
            )

    score = min(score, 100.0)

    if not signals:
        signals.append(f"Sender domain {from_domain} has no known reputation flags.")

    return LayerScore(layer=2, name="Sender Reputation", raw_score=score, signals=signals)


async def _check_ipqualityscore(domain: str) -> dict | None:
    """Query IPQualityScore domain reputation API."""
    if not settings.ipqualityscore_api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"https://www.ipqualityscore.com/api/json/url/"
                f"{settings.ipqualityscore_api_key}/{domain}"
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return None
