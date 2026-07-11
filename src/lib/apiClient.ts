/**
 * API Client — typed wrapper for calling the TalonVigil backend.
 *
 * Uses relative paths ("/api/...") throughout — Vite's dev server proxy
 * (vite.config.ts) and Vercel's rewrite (vercel.json) both already route
 * /api/* to the backend, in dev and production respectively, so no
 * separate base-URL configuration is needed here.
 */
import { supabase } from './supabaseClient'

// ── Types ────────────────────────────────────────────────────────
// Mirrors ThreatScoreCard.tsx's LayerResult/ScanResult exactly — that
// component currently defines these locally and doesn't export them.
// FOLLOW-UP, not fixed here (would mean editing a second file this
// session): ThreatScoreCard.tsx should import these from here instead
// of keeping its own copy. Same "two sources of truth" risk already
// found and fixed multiple times on the backend this session
// (trusted_names/BRAND_LOOKALIKE_LIBRARY, veto_threshold).
export interface LayerResult {
  layer: number
  name: string
  score: number
  multiplier: number
  weighted: number
  signals: string[]
  veto: boolean
}

export interface ScanResponse {
  scan_id: string
  composite_score: number
  classification: 'SAFE' | 'SUSPICIOUS' | 'QUARANTINE' | 'VETO'
  veto_triggered: boolean
  action: string
  layers: LayerResult[]
  summary: string
}

// Mirrors api/routers/scan.py's EmailScanRequest. user_id is deliberately
// NOT included here — the backend overwrites it from the JWT regardless
// of anything the client sends (see scan.py: "payload.user_id = user_id"),
// so exposing a field with zero real effect would just be misleading.
export interface EmailScanRequest {
  raw_headers: string
  from_address: string
  from_name?: string | null
  reply_to?: string | null
  subject: string
  body_text: string
  body_html?: string | null
  attachments?: string[]
}

// ── Errors ───────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) {
    throw new ApiError('Not signed in — no active Supabase session.', 401)
  }
  return data.session.access_token
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = await getAccessToken()

  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    // Parse whatever the backend sent back — FastAPI's HTTPException
    // detail is JSON, but a proxy/edge failure upstream of the backend
    // might return plain text instead. Try JSON first, fall back to
    // text, so a caller always gets *something* useful to display
    // rather than a swallowed parse error masking the real one.
    let detail: unknown
    try {
      detail = await response.json()
    } catch {
      detail = await response.text().catch(() => undefined)
    }
    throw new ApiError(
      `Request to ${path} failed with status ${response.status}`,
      response.status,
      detail
    )
  }

  return response.json() as Promise<T>
}

// ── Public API ─────────────────────────────────────────────────────
export async function scanEmail(payload: EmailScanRequest): Promise<ScanResponse> {
  return apiFetch<ScanResponse>('/api/scan/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
