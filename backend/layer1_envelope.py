"""
Layer 1 — Envelope Analysis
Severity: Critical | Multiplier: 1.8x | Veto-Eligible: Yes

Checks SPF, DKIM, DMARC, and return-path alignment.
"""
import re
from utils.scoring import LayerScore


async def analyze_envelope(payload) -> LayerScore:
    """
    Analyze email authentication envelope.
    Parses raw headers for SPF/DKIM/DMARC results.
    """
    signals = []
    score = 0.0
    headers = payload.raw_headers.lower()

    # ── SPF ───────────────────────────────────────────────────
    if "spf=fail" in headers or "spf=hardfail" in headers:
        score += 40
        signals.append("SPF hard fail: sending IP is not authorized by this domain.")
    elif "spf=softfail" in headers:
        score += 20
        signals.append("SPF soft fail: sending IP is weakly authorized — suspicious.")
    elif "spf=none" in headers:
        score += 10
        signals.append("SPF record missing: domain has no sender policy configured.")

    # ── DKIM ──────────────────────────────────────────────────
    if "dkim=fail" in headers:
        score += 30
        signals.append("DKIM signature failed: message may have been tampered with.")
    elif "dkim=none" in headers:
        score += 10
        signals.append("DKIM not present: message is unsigned and unverified.")

    # ── DMARC ─────────────────────────────────────────────────
    if "dmarc=fail" in headers:
        score += 30
        signals.append("DMARC failed: from-domain does not align with authenticated sender.")
    elif "dmarc=none" in headers:
        score += 5
        signals.append("DMARC policy is 'none': domain owner has not enforced authentication.")

    # ── Return-Path Mismatch ───────────────────────────────────
    from_domain = payload.from_address.split("@")[-1].lower() if "@" in payload.from_address else ""
    return_path_match = re.search(r"return-path:.*?@([a-z0-9.\-]+)", headers)
    if return_path_match:
        return_domain = return_path_match.group(1)
        if return_domain and from_domain and return_domain != from_domain:
            score += 20
            signals.append(
                f"Return-path domain ({return_domain}) does not match from-address "
                f"domain ({from_domain}) — classic spoofing pattern."
            )

    score = min(score, 100.0)

    if not signals:
        signals.append("All authentication checks passed (SPF, DKIM, DMARC).")

    return LayerScore(
        layer=1,
        name="Envelope Analysis",
        raw_score=score,
        signals=signals,
    )
