/**
 * Typed sample data, shaped exactly like the backend ScanResponse so it is swap-ready.
 * Used by the Dashboard history fallback and the public demo report when Supabase /
 * the backend is unavailable. Remove once every screen reads live data.
 */
import type { ScanResult, ScanHistoryItem } from "../types/scan";

type Kind = "quarantine" | "suspicious" | "safe" | "veto";

const RESULTS: Record<Kind, ScanResult> = {
  quarantine: {
    scan_id: "eaa-8841q", composite_score: 91, classification: "QUARANTINE", veto_triggered: false, action: "quarantine",
    summary: "This email impersonates PayPal and pushes you to pay a fake invoice. It never reached your inbox.",
    layers: [
      { layer: 1, name: "Envelope", score: 88, multiplier: 1.8, weighted: 158.4, veto: false, signals: ["SPF hard fail: sending IP 45.13.199.7 is not authorized by secure-paypa1.com.", "No DKIM signature present."] },
      { layer: 2, name: "Reputation", score: 76, multiplier: 1.3, weighted: 98.8, veto: false, signals: ["Domain registered 11 days ago behind a privacy proxy.", "Sending IP hit 3 spam traps in the last 7 days."] },
      { layer: 3, name: "Headers", score: 54, multiplier: 1.2, weighted: 64.8, veto: false, signals: ["Message routed through 2 residential relays before delivery — unusual for a payment provider."] },
      { layer: 4, name: "Linguistics", score: 81, multiplier: 1.4, weighted: 113.4, veto: false, signals: ["Three urgency markers in 40 words: 'today', 'immediately', 'final notice'.", "Payment-redirect phrasing matches known BEC templates."] },
      { layer: 5, name: "Impersonation", score: 93, multiplier: 2.0, weighted: 186, veto: false, signals: ["'secure-paypa1.com' is a lookalike of paypal.com — character swap l -> 1.", "Display name 'PayPal Billing' does not match the sending domain."] },
      { layer: 6, name: "Links", score: 87, multiplier: 1.9, weighted: 165.3, veto: false, signals: ["2 of 3 links resolve to a credential-harvesting page first seen 6 hours ago."] },
      { layer: 7, name: "Behavioral", score: 62, multiplier: 1.1, weighted: 68.2, veto: false, signals: ["First contact: no prior mail from this sender to your inbox."] },
    ],
  },
  suspicious: {
    scan_id: "eaa-3302s", composite_score: 58, classification: "SUSPICIOUS", veto_triggered: false, action: "warn",
    summary: "New bank details from a young domain. Delivered with a warning — verify by phone before you pay anything.",
    layers: [
      { layer: 1, name: "Envelope", score: 12, multiplier: 1.8, weighted: 21.6, veto: false, signals: ["SPF and DKIM both pass; DMARC aligned."] },
      { layer: 2, name: "Reputation", score: 61, multiplier: 1.3, weighted: 79.3, veto: false, signals: ["Domain is 4 months old — young for a vendor you pay regularly."] },
      { layer: 3, name: "Headers", score: 18, multiplier: 1.2, weighted: 21.6, veto: false, signals: ["Routing path is normal for this provider."] },
      { layer: 4, name: "Linguistics", score: 72, multiplier: 1.4, weighted: 100.8, veto: false, signals: ["Message asks you to change payment destination — the single most common BEC move.", "Mild deadline pressure: 'before the next billing cycle'."] },
      { layer: 5, name: "Impersonation", score: 44, multiplier: 2.0, weighted: 88, veto: false, signals: ["Sender name matches a vendor you know, but from a different domain than their last 3 invoices."] },
      { layer: 6, name: "Links", score: 15, multiplier: 1.9, weighted: 28.5, veto: false, signals: ["1 link, resolves to a legitimate document host."] },
      { layer: 7, name: "Behavioral", score: 66, multiplier: 1.1, weighted: 72.6, veto: false, signals: ["This sender has emailed you 3 times — but never about payment details."] },
    ],
  },
  safe: {
    scan_id: "eaa-1177a", composite_score: 6, classification: "SAFE", veto_triggered: false, action: "deliver",
    summary: "Everything checks out. Delivered to your inbox untouched.",
    layers: [
      { layer: 1, name: "Envelope", score: 2, multiplier: 1.8, weighted: 3.6, veto: false, signals: ["SPF, DKIM and DMARC all pass and align."] },
      { layer: 2, name: "Reputation", score: 4, multiplier: 1.3, weighted: 5.2, veto: false, signals: ["9-year-old domain with a clean sending record."] },
      { layer: 3, name: "Headers", score: 3, multiplier: 1.2, weighted: 3.6, veto: false, signals: ["Direct route from the sender's own mail server."] },
      { layer: 4, name: "Linguistics", score: 8, multiplier: 1.4, weighted: 11.2, veto: false, signals: ["No pressure cues, no payment language."] },
      { layer: 5, name: "Impersonation", score: 1, multiplier: 2.0, weighted: 2, veto: false, signals: ["Display name and domain match the sender's history exactly."] },
      { layer: 6, name: "Links", score: 5, multiplier: 1.9, weighted: 9.5, veto: false, signals: ["1 link, clean, points to a domain you've visited before."] },
      { layer: 7, name: "Behavioral", score: 2, multiplier: 1.1, weighted: 2.2, veto: false, signals: ["42 prior emails from this sender; attachment type is typical for this thread."] },
    ],
  },
  veto: {
    scan_id: "eaa-6650v", composite_score: 34, classification: "VETO", veto_triggered: true, action: "quarantine",
    summary: "The composite score was low — but the Links layer found a confirmed malware host and vetoed delivery on its own authority.",
    layers: [
      { layer: 1, name: "Envelope", score: 9, multiplier: 1.8, weighted: 16.2, veto: false, signals: ["SPF and DKIM pass."] },
      { layer: 2, name: "Reputation", score: 28, multiplier: 1.3, weighted: 36.4, veto: false, signals: ["Domain has a mixed sending record — mostly newsletters, occasional abuse reports."] },
      { layer: 3, name: "Headers", score: 11, multiplier: 1.2, weighted: 13.2, veto: false, signals: ["Standard bulk-mail routing."] },
      { layer: 4, name: "Linguistics", score: 16, multiplier: 1.4, weighted: 22.4, veto: false, signals: ["Ordinary newsletter language, no pressure cues."] },
      { layer: 5, name: "Impersonation", score: 8, multiplier: 2.0, weighted: 16, veto: false, signals: ["No impersonation signals."] },
      { layer: 6, name: "Links", score: 99, multiplier: 1.9, weighted: 188.1, veto: true, signals: ["Link #4 resolves to a host on 2 live malware blocklists, confirmed serving a payload 90 minutes ago.", "VETO issued: confirmed-malware findings bypass composite scoring by design."] },
      { layer: 7, name: "Behavioral", score: 21, multiplier: 1.1, weighted: 23.1, veto: false, signals: ["You've received 12 prior digests from this sender without incident."] },
    ],
  },
};

export function sampleResultFor(kind: Kind): ScanResult {
  return RESULTS[kind];
}

export const MOCK_HISTORY: ScanHistoryItem[] = [
  { ...RESULTS.quarantine, received_at: hoursAgo(2), from_address: "billing@secure-paypa1.com", subject: "Invoice #8841 — payment needed today" },
  { ...RESULTS.safe, scan_id: "h-2", received_at: hoursAgo(3), from_address: "sara@clientfirm.com", subject: "Contract draft v3 attached" },
  { ...RESULTS.veto, received_at: hoursAgo(5), from_address: "newsletter@industry-digest.co", subject: "Your July industry roundup" },
  { ...RESULTS.safe, scan_id: "h-4", composite_score: 4, received_at: hoursAgo(8), from_address: "orders@paperandink.co", subject: "Your order #2205 shipped" },
  { ...RESULTS.suspicious, received_at: hoursAgo(26), from_address: "ap@vendor-invoices.net", subject: "Updated payment details for July" },
  { ...RESULTS.safe, scan_id: "h-6", composite_score: 11, received_at: hoursAgo(28), from_address: "hello@bookkeeperco.com", subject: "June reconciliation ready for review" },
];

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}
