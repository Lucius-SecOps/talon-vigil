"""
Indicator Utilities
Salvaged and adapted from threat_intelligence.py.
Used by Layer 2 (Sender Reputation), Layer 5 (Impersonation), Layer 6 (Links).
"""
import re
import socket
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
from urllib.parse import urlparse


# ── Enum: IOC Types (from threat_intelligence.py::IOCType) ────
class IOCType(Enum):
    IP_ADDRESS = "ip_address"
    DOMAIN     = "domain"
    URL        = "url"
    EMAIL      = "email"
    FILE_HASH  = "file_hash"


# ── Dataclass: Threat Indicator (from ThreatIndicator) ────────
@dataclass
class ThreatIndicator:
    """
    Represents a single threat intelligence indicator.
    Adapted from: threat_intelligence.py::ThreatIndicator
    """
    value:       str
    ioc_type:    IOCType
    score:       float = 0.0          # 0-100 risk score
    source:      str = ""             # Which feed flagged it
    description: str = ""
    tags:        list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "value":       self.value,
            "ioc_type":    self.ioc_type.value,
            "score":       self.score,
            "source":      self.source,
            "description": self.description,
            "tags":        self.tags,
        }


# ── Normalization (from threat_intelligence.py::normalize_indicator) ──
def normalize_indicator(value: str, ioc_type: IOCType) -> str:
    """
    Normalize an indicator value for consistent comparison.
    Adapted from: threat_intelligence.py::normalize_indicator()
    """
    value = value.strip().lower()

    if ioc_type == IOCType.DOMAIN:
        # Strip protocol and trailing slash
        value = re.sub(r"^https?://", "", value)
        value = value.split("/")[0]
        value = value.lstrip("www.")

    elif ioc_type == IOCType.URL:
        # Normalize to lowercase, strip fragments
        value = value.split("#")[0]

    elif ioc_type == IOCType.EMAIL:
        # Lowercase the domain part
        if "@" in value:
            local, domain = value.rsplit("@", 1)
            value = f"{local}@{domain.lower()}"

    elif ioc_type == IOCType.IP_ADDRESS:
        # No transformation needed beyond strip/lower
        pass

    return value


# ── Validation (from threat_intelligence.py::is_valid_indicator) ──
def is_valid_indicator(value: str, ioc_type: IOCType) -> bool:
    """
    Validate an indicator value matches the expected format.
    Adapted from: threat_intelligence.py::is_valid_indicator()
    """
    if not value or not isinstance(value, str):
        return False

    value = value.strip()

    if ioc_type == IOCType.IP_ADDRESS:
        pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
        if not re.match(pattern, value):
            return False
        parts = value.split(".")
        return all(0 <= int(p) <= 255 for p in parts)

    elif ioc_type == IOCType.DOMAIN:
        pattern = r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$"
        return bool(re.match(pattern, value))

    elif ioc_type == IOCType.URL:
        try:
            parsed = urlparse(value)
            return parsed.scheme in ("http", "https") and bool(parsed.netloc)
        except Exception:
            return False

    elif ioc_type == IOCType.EMAIL:
        pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, value))

    elif ioc_type == IOCType.FILE_HASH:
        # MD5, SHA1, or SHA256
        return bool(re.match(r"^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$", value))

    return False


# ── Levenshtein Distance for L5 Impersonation ─────────────────
def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Compute Levenshtein edit distance between two strings.
    Used by Layer 5 to detect lookalike domains.
    Distance of 1-2 against a high-value brand = impersonation signal.
    """
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    prev_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        curr_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions  = prev_row[j + 1] + 1
            deletions   = curr_row[j] + 1
            substitutions = prev_row[j] + (c1 != c2)
            curr_row.append(min(insertions, deletions, substitutions))
        prev_row = curr_row

    return prev_row[-1]


# ── Top 50 APWG High-Value Impersonation Targets (L5 seed) ────
BRAND_LOOKALIKE_LIBRARY = [
    "paypal.com", "microsoft.com", "apple.com", "google.com",
    "amazon.com", "irs.gov", "facebook.com", "netflix.com",
    "linkedin.com", "instagram.com", "twitter.com", "x.com",
    "chase.com", "bankofamerica.com", "wellsfargo.com", "citibank.com",
    "americanexpress.com", "dropbox.com", "docusign.com", "zoom.us",
    "sharepoint.com", "outlook.com", "office365.com", "onedrive.com",
    "icloud.com", "coinbase.com", "binance.com", "stripe.com",
    "squarespace.com", "shopify.com", "salesforce.com", "slack.com",
    "github.com", "gitlab.com", "atlassian.com", "jira.com",
    "dhl.com", "fedex.com", "ups.com", "usps.com",
    "ubereats.com", "doordash.com", "venmo.com", "cashapp.com",
    "zelle.com", "turbotax.com", "intuit.com", "quickbooks.com",
    "socialsecurity.gov", "medicare.gov",
]


def score_lookalike_domain(domain: str) -> tuple[float, str]:
    """
    Check if a domain is a lookalike of a high-value brand.
    Returns (score, matched_brand).

    Scoring:
      distance == 0 → exact match (not a lookalike, score 0)
      distance == 1 → critical lookalike (score 95)
      distance == 2 → high lookalike (score 70)
      distance == 3 → moderate (score 40)
      distance > 3  → not flagged (score 0)
    """
    domain = normalize_indicator(domain, IOCType.DOMAIN)

    best_distance = 999
    best_match = ""

    for brand in BRAND_LOOKALIKE_LIBRARY:
        brand_root = brand.split(".")[0]
        domain_root = domain.split(".")[0]
        dist = levenshtein_distance(domain_root, brand_root)

        if dist < best_distance:
            best_distance = dist
            best_match = brand

    if best_distance == 0:
        return 0.0, ""          # Exact match = legitimate domain
    elif best_distance == 1:
        return 95.0, best_match
    elif best_distance == 2:
        return 70.0, best_match
    elif best_distance == 3:
        return 40.0, best_match
    else:
        return 0.0, ""
