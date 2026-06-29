"""
Shared pytest fixtures and helpers for the TalonVigil backend test suite.

This module is intentionally free of any `engine.*` / layer-module imports.
Layer modules couple logic to network libraries and live config at import
time (see standing finding), so importing them here would drag that side-effect
surface into every test session. conftest stays clean: payload construction and
a hard production-safety guard only.
"""
import os

import pytest
from types import SimpleNamespace


# ─────────────────────────────────────────────────────────────────────────────
# make_payload — DRY payload builder for layer unit tests
# ─────────────────────────────────────────────────────────────────────────────
# Returns a SimpleNamespace, not a Pydantic EmailScanRequest, by design:
# the layer functions read the payload via attribute access (payload.from_address,
# payload.raw_headers, ...), so a SimpleNamespace can be passed straight in.
# This deliberately does NOT run Pydantic validation — these are layer-logic
# unit tests, not request-contract tests. Contract validation belongs in a
# separate test that exercises EmailScanRequest itself.
#
# All NINE EmailScanRequest fields are populated with benign, individually
# valid defaults. Any field is overridable via keyword:
#     make_payload(from_address="evil@paypa1.com")
#     make_payload(attachments=["invoice.exe"])

# Required fields on EmailScanRequest (no model default):
#   raw_headers, from_address, subject, body_text, user_id
# Optional fields (model supplies a default):
#   from_name=None, reply_to=None, body_html=None, attachments=[]
_BENIGN_DEFAULTS: dict = {
    # ── Required ─────────────────────────────────────────────────────────────
    "raw_headers": (
        "Received: from mail.example.com (mail.example.com [203.0.113.10])\n"
        "Authentication-Results: mx.example.com; spf=pass; dkim=pass; dmarc=pass\n"
        "Message-ID: <benign-0001@example.com>\n"
        "Return-Path: <alice@example.com>\n"
    ),
    "from_address": "alice@example.com",
    "subject": "Quarterly sync notes",
    "body_text": "Hi team, attaching the notes from this morning. Talk soon.",
    "user_id": "00000000-0000-0000-0000-000000000000",
    # ── Optional (defaults mirror the model, but populated non-trivially so a
    #    layer reading any of them gets a sane value rather than a None that
    #    could silently mask a test) ───────────────────────────────────────────
    "from_name": "Alice Example",
    "reply_to": "alice@example.com",
    "body_html": "<p>Hi team, attaching the notes from this morning. Talk soon.</p>",
    "attachments": [],
}


def make_payload(**overrides) -> SimpleNamespace:
    """
    Build a benign EmailScanRequest-shaped payload for layer unit tests.

    All nine fields are populated with safe defaults; pass any field as a
    keyword to override it. `attachments` is copied per-call so a test that
    mutates the list cannot leak state into another test.

    Example:
        payload = make_payload(from_address="ceo@gmail.com", from_name="CEO")
    """
    data = dict(_BENIGN_DEFAULTS)
    # Defensive copy of the only mutable default so per-test mutation is isolated.
    data["attachments"] = list(data["attachments"])
    data.update(overrides)
    return SimpleNamespace(**data)


# ─────────────────────────────────────────────────────────────────────────────
# Production-safety guard — autouse, session-scoped, no opt-in
# ─────────────────────────────────────────────────────────────────────────────
# Hard stop against ever pointing the test suite at the real Supabase project.
# If SUPABASE_URL contains the live project ref, the entire session fails before
# any test runs. autouse=True + scope="session" means this cannot be bypassed
# by forgetting to request a fixture.
_REAL_PROJECT_REF = "cohnfqutypzhhpscudnw"


@pytest.fixture(scope="session", autouse=True)
def _guard_against_production_supabase():
    """Fail the entire test session if pointed at the real Supabase project."""
    supabase_url = os.environ.get("SUPABASE_URL", "")
    if _REAL_PROJECT_REF in supabase_url:
        pytest.fail(
            "ABORTING TEST SESSION: SUPABASE_URL points at the real TalonVigil "
            f"project (ref '{_REAL_PROJECT_REF}'). Tests must never run against "
            "production data. Export a local/staging SUPABASE_URL before running "
            "pytest.",
            pytrace=False,
        )
    yield
