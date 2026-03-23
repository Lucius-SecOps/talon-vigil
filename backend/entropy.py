"""
Entropy Utilities
Salvaged and adapted from adaptive_scoring.py (_calculate_entropy).
Used by Layer 6 (URL entropy scoring) and Layer 3 (Message-ID analysis).
"""
import math
import re
from urllib.parse import urlparse


def calculate_shannon_entropy(text: str) -> float:
    """
    Calculate Shannon entropy of a string.
    High entropy (> 3.5) on a URL path is a strong indicator
    of a toolkit-generated phishing URL.

    Scale: 0.0 (perfectly predictable) → ~5.0 (maximally random)
    Adapted from: adaptive_scoring.py::FeatureExtractor._calculate_entropy()
    """
    if not text:
        return 0.0

    # Frequency of each character
    freq = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1

    length = len(text)
    entropy = 0.0
    for count in freq.values():
        prob = count / length
        if prob > 0:
            entropy -= prob * math.log2(prob)

    return round(entropy, 4)


def score_url_entropy(url: str) -> float:
    """
    Score a URL's path entropy on a 0-100 scale for L6.

    Scoring logic:
      - Parse URL, extract path + query string
      - Calculate Shannon entropy of the path
      - Map entropy to risk score:
        < 2.5 → low risk (10)
        2.5 – 3.5 → medium risk (40)
        3.5 – 4.2 → high risk (70)
        > 4.2 → critical risk (90)
    """
    try:
        parsed = urlparse(url)
        path = parsed.path + ("?" + parsed.query if parsed.query else "")
        entropy = calculate_shannon_entropy(path)

        if entropy < 2.5:
            return 10.0
        elif entropy < 3.5:
            return 40.0
        elif entropy < 4.2:
            return 70.0
        else:
            return 90.0

    except Exception:
        return 0.0


def calculate_time_anomaly(
    hour: int,
    typical_min_hour: int,
    typical_max_hour: int,
) -> float:
    """
    Score how anomalous an email's send hour is relative to
    the sender's established typical send window.

    Used by Layer 7 (Behavioral Context Engine).
    Adapted from: adaptive_scoring.py::FeatureExtractor._calculate_time_anomaly()

    Args:
        hour: Hour of day the email was sent (0-23 UTC)
        typical_min_hour: Start of sender's typical send window
        typical_max_hour: End of sender's typical send window

    Returns:
        Risk score 0-100
    """
    if typical_min_hour == 0 and typical_max_hour == 0:
        # No baseline established yet — no penalty
        return 0.0

    if typical_min_hour <= hour <= typical_max_hour:
        return 0.0

    # Calculate how far outside the window the email landed
    distance = min(
        abs(hour - typical_min_hour),
        abs(hour - typical_max_hour)
    )

    # Scale: 1 hour outside = 20 points, 6+ hours = 80 points
    score = min(distance * (80 / 6), 80.0)
    return round(score, 2)


def calculate_frequency_anomaly(
    recent_count: int,
    baseline_weekly_avg: float,
) -> float:
    """
    Score how anomalous the sender's recent email volume is.

    Used by Layer 7 (Behavioral Context Engine).
    Adapted from: adaptive_scoring.py::FeatureExtractor._calculate_frequency_anomaly()

    Args:
        recent_count: Number of emails from this sender in the last 7 days
        baseline_weekly_avg: Historical weekly average for this sender

    Returns:
        Risk score 0-100
    """
    if baseline_weekly_avg == 0:
        return 0.0

    ratio = recent_count / baseline_weekly_avg

    if ratio <= 2.0:
        return 0.0
    elif ratio <= 5.0:
        return 30.0
    elif ratio <= 10.0:
        return 60.0
    else:
        return 85.0
