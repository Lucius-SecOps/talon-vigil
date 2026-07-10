/**
 * TalonVigil API client.
 *  - POST /api/scan/  runs the 8-layer engine. Requires a Supabase Bearer token
 *    (backend uses get_current_user + rate-limits 20/min). Proxied to the FastAPI
 *    host in dev (vite.config.ts) and rewritten to api.talonvigil.com in prod (vercel.json).
 *  - Scan history is read straight from the `scan_records` Supabase table
 *    (already written server-side by _persist_scan). No REST endpoint needed.
 */
import type { EmailScanRequest, ScanResult, ScanHistoryItem, Classification } from "../types/scan";
import { supabase, getAccessToken } from "./supabase";
import { MOCK_HISTORY, sampleResultFor } from "./mockData";

const API_BASE = "/api";

/** Thrown for any non-2xx / network / auth failure. Carries a code for the UI. */
export class ApiError extends Error {
  code: string;
  status?: number;
  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/** Run an email through the engine. Attaches the Supabase session token when present. */
export async function scanEmail(payload: EmailScanRequest): Promise<ScanResult> {
  const token = await getAccessToken();
  if (!token) throw new ApiError("Not signed in", "AUTH");

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/scan/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError("Network unreachable", "NETWORK");
  }
  if (res.status === 401 || res.status === 403) throw new ApiError("Session expired", "AUTH", res.status);
  if (res.status === 429) throw new ApiError("Rate limit reached — try again in a minute", "SC-429", 429);
  if (!res.ok) throw new ApiError(`Scan failed (${res.status})`, res.status >= 500 ? "SC-500" : `SC-${res.status}`, res.status);
  return res.json() as Promise<ScanResult>;
}

/**
 * Public demo: try a real scan of a sample email, fall back to a bundled sample
 * result when unauthenticated / backend down so the page still demonstrates EAA.
 */
export async function runSampleScan(
  kind: "quarantine" | "suspicious" | "safe" | "veto" = "quarantine",
): Promise<{ result: ScanResult; live: boolean }> {
  try {
    const result = await scanEmail(samplePayload(kind));
    return { result, live: true };
  } catch {
    return { result: sampleResultFor(kind), live: false };
  }
}

/**
 * Signed-in user's scan history, newest first. Reads the `scan_records` table the
 * backend already writes to. Falls back to mock data when Supabase is unconfigured
 * or the user is not signed in (keeps the Dashboard usable in local demo).
 */
export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  if (!supabase) return MOCK_HISTORY;
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return MOCK_HISTORY;

  const { data, error } = await supabase
    .from("scan_records")
    .select("id, from_address, composite_score, classification, veto_triggered, action_taken, layer_scores, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new ApiError(error.message, "HX-503");

  return (data ?? []).map((r): ScanHistoryItem => ({
    scan_id: String(r.id),
    composite_score: r.composite_score,
    classification: r.classification as Classification,
    veto_triggered: r.veto_triggered,
    action: r.action_taken,
    layers: r.layer_scores ?? [],
    summary: r.summary,
    received_at: r.created_at,
    from_address: r.from_address,
    // subject is stored hashed for privacy; show a friendly placeholder in the UI
    subject: "Scanned message",
  }));
}

function samplePayload(kind: string): EmailScanRequest {
  const base: EmailScanRequest = {
    raw_headers: "Received: from mail.example.com ...",
    from_address: "billing@secure-paypa1.com",
    from_name: "PayPal Billing",
    subject: "Invoice #8841 — payment needed today",
    body_text: "Your payment is overdue. Click here immediately to avoid suspension.",
    attachments: [],
  };
  if (kind === "safe") return { ...base, from_address: "sara@clientfirm.com", from_name: "Sara", subject: "Contract draft v3 attached", body_text: "Hi — latest draft attached, no rush." };
  if (kind === "suspicious") return { ...base, from_address: "ap@vendor-invoices.net", from_name: "Accounts Payable", subject: "Updated payment details for July", body_text: "Please update our bank details before the next cycle." };
  if (kind === "veto") return { ...base, from_address: "newsletter@industry-digest.co", from_name: "Industry Digest", subject: "Your July industry roundup", body_text: "This month's stories. Read more at the link below." };
  return base;
}
