"""
Regression tests for layer6_links.py — href/text domain mismatch detection.

Guards the bug class fixed in af861e2: lstrip("www.") stripped the character
SET {w,.} instead of the literal prefix, mangling domains like workday.com
-> orkday.com and risking SUPPRESSED (false-negative) mismatches on a
Critical, veto-eligible layer.
"""
from engine.layer6_links import _find_href_mismatches


def test_www_prefix_stripped_literally_not_as_charset():
    html = '<a href="https://www.workday.com/login">workday.com</a>'
    mismatches = _find_href_mismatches(html)
    assert mismatches == [], f"www.workday.com vs workday.com should NOT be flagged; got {mismatches}"


def test_leading_w_domain_not_mangled():
    html = '<a href="https://w3.org/standards">w3.org</a>'
    mismatches = _find_href_mismatches(html)
    assert mismatches == [], f"w3.org should survive normalization intact; got {mismatches}"


def test_genuine_mismatch_still_detected():
    html = '<a href="https://evil-harvest.ru/login">paypal.com</a>'
    mismatches = _find_href_mismatches(html)
    assert len(mismatches) == 1, f"genuine text/href domain mismatch must be detected; got {mismatches}"


def test_www_on_both_sides_of_genuine_mismatch():
    html = '<a href="https://www.paypa1-secure.com">www.paypal.com</a>'
    mismatches = _find_href_mismatches(html)
    assert len(mismatches) == 1, f"mismatch with www. on both sides must still fire; got {mismatches}"