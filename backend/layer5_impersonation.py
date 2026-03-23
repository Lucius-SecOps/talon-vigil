"""
Layer 5 — Identity Impersonation Detection
Severity: Critical | Multiplier: 2.0x | Veto-Eligible: Yes
Highest weight layer in the model.
"""
import re
from utils.scoring import LayerScore
from utils.indicators import (
    normalize_indicator, IOCType, score_lookalike_domain
)


async def analyze_impersonation(payload) -> LayerScore:
    signals = []
    score = 0.0

    from_address = payload.from_address.lower()
    from_name = (payload.from_name or "").lower()
    from_domain = from_address.split("@")[-1] if "@" in from_address else ""

    # ── 1. Lookalike Domain Detection ─────────────────────────
    lookalike_score, matched_brand = score_lookalike_domain(from_domain)
    if lookalike_score > 0:
        score += lookalike_score
        signals.append(
            f"Lookalike domain detected: '{from_domain}' is 1-2 characters from "
            f"'{matched_brand}' — strong impersonation signal."
        )

    # ── 2. Display Name Spoofing ───────────────────────────────
    # Checks if the display name contains a trusted brand but the
    # from-address domain is unrelated
    trusted_names = [
        "apple", "microsoft", "google", "paypal", "amazon", "irs",
        "facebook", "netflix", "support", "security", "helpdesk",
        "noreply", "admin", "billing", "account",
    ]
    for name in trusted_names:
        if name in from_name and name not in from_domain:
            score += 40
            signals.append(
                f"Display name spoofing: name contains '{name}' but sending domain "
                f"is '{from_domain}' — email client may show a trusted name with an unrelated address."
            )
            break  # One match is sufficient

    # ── 3. Unicode Homoglyph Detection ────────────────────────
    # Check for Cyrillic or other confusable chars in the from address
    if re.search(r"[\u0430-\u044f\u0400-\u042f]", from_domain):
        score += 80
        signals.append(
            "Unicode homoglyph detected in sender domain — Cyrillic characters "
            "used to visually mimic a Latin domain name."
        )

    # ── 4. Internal Authority Impersonation ───────────────────
    # From-name claims internal authority but domain is external
    authority_claims = ["ceo", "cfo", "cto", "it department", "hr", "payroll", "finance"]
    for claim in authority_claims:
        if claim in from_name:
            # If it came from a free email provider, that's a red flag
            free_providers = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "protonmail.com"]
            if from_domain in free_providers:
                score += 50
                signals.append(
                    f"Internal authority impersonation: display name claims '{claim}' "
                    f"but email originates from free provider '{from_domain}'."
                )
            break

    score = min(score, 100.0)

    if not signals:
        signals.append("No identity impersonation patterns detected.")

    return LayerScore(layer=5, name="Identity Impersonation", raw_score=score, signals=signals)
