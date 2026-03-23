"""
Layer 7 — Behavioral Context Engine
Severity: Medium | Multiplier: 1.1x (v1) → 1.5x (v2)
Veto-Eligible: No

Requires 90-day baseline window. Scoring suppressed for new users.
Stores only derived signals — never raw email content.
"""
from datetime import datetime
from utils.scoring import LayerScore
from utils.entropy import calculate_time_anomaly, calculate_frequency_anomaly
from config import get_settings

settings = get_settings()


async def analyze_behavioral(payload) -> LayerScore:
    """
    Query Supabase for sender behavioral baseline and score anomalies.
    If no baseline exists (< 90 days), returns score of 0 — no false positives
    on cold-start users.
    """
    signals = []
    score = 0.0

    from_domain = payload.from_address.split("@")[-1].lower() if "@" in payload.from_address else ""
    user_id = payload.user_id

    # Fetch behavioral baseline from Supabase
    baseline = await _get_sender_baseline(user_id, from_domain)

    if baseline is None:
        return LayerScore(
            layer=7,
            name="Behavioral Context Engine",
            raw_score=0.0,
            signals=[
                "No behavioral baseline available yet. "
                "Layer 7 scoring activates after 90 days of inbox data."
            ],
        )

    # ── First Contact Flag ─────────────────────────────────────
    if baseline.get("interaction_count", 0) == 0:
        score += 25
        signals.append(
            f"First contact: TalonVigil has never seen an email from '{from_domain}' "
            f"in your inbox before."
        )

    # ── Send Time Anomaly ──────────────────────────────────────
    current_hour = datetime.utcnow().hour
    typical_min = baseline.get("typical_min_hour", 0)
    typical_max = baseline.get("typical_max_hour", 0)
    time_score = calculate_time_anomaly(current_hour, typical_min, typical_max)
    if time_score > 20:
        score += time_score
        signals.append(
            f"Send-time anomaly: email arrived at {current_hour:02d}:00 UTC, "
            f"outside this sender's typical window ({typical_min:02d}:00–{typical_max:02d}:00 UTC)."
        )

    # ── Volume Spike ───────────────────────────────────────────
    recent_count = baseline.get("recent_weekly_count", 0)
    avg_weekly = baseline.get("avg_weekly_count", 1)
    freq_score = calculate_frequency_anomaly(recent_count, avg_weekly)
    if freq_score > 20:
        score += freq_score
        signals.append(
            f"Volume spike: {recent_count} emails this week from '{from_domain}', "
            f"vs. historical average of {avg_weekly:.1f}/week."
        )

    score = min(score, 100.0)

    if not signals:
        signals.append(
            f"Sender '{from_domain}' matches established behavioral baseline."
        )

    return LayerScore(layer=7, name="Behavioral Context Engine", raw_score=score, signals=signals)


async def _get_sender_baseline(user_id: str, sender_domain: str) -> dict | None:
    """
    Fetch sender behavioral baseline from Supabase.
    Returns None if baseline hasn't matured yet (< 90 days of data).

    Data stored per spec:
    - sender_domain (not email address)
    - first_contact_at
    - avg_weekly_count (derived integer)
    - typical_min_hour / typical_max_hour (derived integers)
    - interaction_count (rolling 90-day integer)
    NEVER stores email content, subject lines, or recipient identity.
    """
    # TODO: implement Supabase query
    # from supabase import create_client
    # client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    # result = client.table("sender_baselines")
    #     .select("*")
    #     .eq("user_id", user_id)
    #     .eq("sender_domain", sender_domain)
    #     .single()
    #     .execute()
    # return result.data if result.data else None
    return None  # Stub — returns None until Supabase schema is connected
