"""
Layer 6 — Link & Payload Intelligence
Severity: Critical | Multiplier: 1.9x | Veto-Eligible: Yes
v1: Passive scanning only (entropy + reputation feeds).
Active URL detonation is a v2 feature.
"""
import re
import httpx
from urllib.parse import urlparse
from utils.scoring import LayerScore
from utils.entropy import score_url_entropy
from utils.indicators import normalize_indicator, IOCType, is_valid_indicator
from config import get_settings

settings = get_settings()

# High-risk attachment extensions
DANGEROUS_EXTENSIONS = {
    ".exe", ".iso", ".img", ".msi", ".bat", ".cmd", ".ps1",
    ".vbs", ".js", ".jar", ".xlsm", ".docm", ".xlam", ".ppam",
}


async def analyze_links(payload) -> LayerScore:
    signals = []
    score = 0.0

    # ── 1. Extract all URLs from body ─────────────────────────
    body = payload.body_text + (payload.body_html or "")
    urls = re.findall(r'https?://[^\s"\'<>]+', body)

    for url in urls[:20]:  # Cap at 20 URLs per email
        url = url.rstrip(".,;)")

        # ── Entropy scoring ────────────────────────────────────
        entropy_score = score_url_entropy(url)
        if entropy_score >= 70:
            score = max(score, entropy_score)
            signals.append(
                f"High URL entropy detected: '{_truncate(url)}' — "
                f"random-looking path is a phishing toolkit fingerprint."
            )

        # ── Google Safe Browsing ───────────────────────────────
        gsb_result = await _check_safe_browsing(url)
        if gsb_result:
            score = max(score, 95)
            signals.append(
                f"Google Safe Browsing confirmed malicious URL: '{_truncate(url)}' "
                f"— threat type: {gsb_result}."
            )

        # ── Display text vs href mismatch ─────────────────────
        href_mismatches = _find_href_mismatches(payload.body_html or "")
        for mismatch in href_mismatches[:3]:
            score = max(score, 70)
            signals.append(
                f"Link text/href mismatch: text says '{mismatch[0]}' but "
                f"href points to '{_truncate(mismatch[1])}'."
            )

    # ── 2. Attachment Risk Scoring ─────────────────────────────
    for attachment in payload.attachments:
        ext = "." + attachment.rsplit(".", 1)[-1].lower() if "." in attachment else ""
        if ext in DANGEROUS_EXTENSIONS:
            score = max(score, 75)
            signals.append(
                f"High-risk attachment: '{attachment}' — "
                f"file type '{ext}' is commonly used to deliver malware."
            )

    score = min(score, 100.0)

    if not signals:
        signals.append("No malicious URLs or high-risk attachments detected.")

    return LayerScore(layer=6, name="Link & Payload Intelligence", raw_score=score, signals=signals)


async def _check_safe_browsing(url: str) -> str | None:
    """
    Check URL against Google Safe Browsing API v4.
    Returns threat type string if malicious, None if safe.
    """
    if not settings.google_safe_browsing_api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"https://safebrowsing.googleapis.com/v4/threatMatches:find"
                f"?key={settings.google_safe_browsing_api_key}",
                json={
                    "client": {"clientId": "talonvigil", "clientVersion": "1.0.0"},
                    "threatInfo": {
                        "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                        "platformTypes": ["ANY_PLATFORM"],
                        "threatEntryTypes": ["URL"],
                        "threatEntries": [{"url": url}],
                    },
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                matches = data.get("matches", [])
                if matches:
                    return matches[0].get("threatType", "UNKNOWN")
    except Exception:
        pass
    return None


def _find_href_mismatches(html: str) -> list[tuple[str, str]]:
    """Find anchor tags where display text domain differs from href domain."""
    mismatches = []
    pattern = r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>([^<]+)</a>'
    for match in re.finditer(pattern, html, re.IGNORECASE):
        href, text = match.group(1), match.group(2).strip()
        try:
            href_domain = urlparse(href).netloc.lower().lstrip("www.")
            # Check if display text looks like a different domain
            text_domain_match = re.search(r'([a-z0-9\-]+\.[a-z]{2,})', text.lower())
            if text_domain_match:
                text_domain = text_domain_match.group(1).lstrip("www.")
                if text_domain != href_domain and href_domain:
                    mismatches.append((text_domain, href))
        except Exception:
            pass
    return mismatches


def _truncate(url: str, max_len: int = 60) -> str:
    return url[:max_len] + "..." if len(url) > max_len else url
