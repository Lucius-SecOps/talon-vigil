"""
Layer 3 — Header Forensics
Severity: High | Multiplier: 1.2x | Veto-Eligible: No
"""
import re
from utils.scoring import LayerScore


async def analyze_headers(payload) -> LayerScore:
    signals = []
    score = 0.0
    headers = payload.raw_headers

    # Reply-To domain mismatch
    reply_to = payload.reply_to or ""
    from_domain = payload.from_address.split("@")[-1].lower() if "@" in payload.from_address else ""
    if reply_to and "@" in reply_to:
        reply_domain = reply_to.split("@")[-1].lower()
        if reply_domain != from_domain:
            score += 35
            signals.append(
                f"Reply-To domain ({reply_domain}) differs from sender domain "
                f"({from_domain}) — common BEC technique."
            )

    # Message-ID anomaly — templated/missing
    msg_id_match = re.search(r"message-id:\s*(<[^>]+>)", headers, re.IGNORECASE)
    if not msg_id_match:
        score += 20
        signals.append("Message-ID header is missing — unusual for legitimate email clients.")
    else:
        msg_id = msg_id_match.group(1)
        # Templated / bulk-tool pattern: all digits or random alphanumeric with no dots
        if re.match(r"<[0-9a-f]{20,}@", msg_id, re.IGNORECASE):
            score += 15
            signals.append("Message-ID format matches bulk phishing toolkit pattern.")

    # Multiple received hops with mismatched domains
    received_hops = re.findall(r"^Received:", headers, re.MULTILINE)
    if len(received_hops) > 8:
        score += 15
        signals.append(
            f"Unusual relay chain depth ({len(received_hops)} hops) — "
            f"may indicate routing obfuscation."
        )

    score = min(score, 100.0)
    if not signals:
        signals.append("No header anomalies detected.")

    return LayerScore(layer=3, name="Header Forensics", raw_score=score, signals=signals)
