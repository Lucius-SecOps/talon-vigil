/**
 * TalonVigil — shared scan types.
 * These MIRROR the backend contract exactly (backend/api/routers/scan.py).
 * Keep them in sync with the Pydantic models.
 */

export type Classification = "SAFE" | "SUSPICIOUS" | "QUARANTINE" | "VETO";

/** One detection layer's output (backend LayerResult). Layers 1-7; L8 is the gate. */
export interface LayerResult {
  layer: number;
  name: string;
  score: number;        // 0-100 raw score
  multiplier: number;   // locked weight (L5 highest at 2.0)
  weighted: number;     // score * multiplier
  signals: string[];    // human-readable EAA explanations
  veto: boolean;        // this layer triggered a veto override
}

/** Full EAA threat report (backend ScanResponse). */
export interface ScanResult {
  scan_id: string;
  composite_score: number;
  classification: Classification;
  veto_triggered: boolean;
  action: string;                   // deliver / warn / quarantine
  layers: LayerResult[];
  summary: string;
}

/** Payload accepted by POST /api/scan/ (backend EmailScanRequest). user_id is server-populated. */
export interface EmailScanRequest {
  raw_headers: string;
  from_address: string;
  from_name?: string;
  reply_to?: string;
  subject: string;
  body_text: string;
  body_html?: string;
  attachments?: string[];
  user_id?: string;
}

/** A scan as it appears in history (mirrors a scan_records row). */
export interface ScanHistoryItem extends ScanResult {
  received_at: string;   // ISO timestamp
  from_address: string;
  subject: string;
}

/** Locked scoring constants — mirror backend/utils/scoring.py. */
export const QUARANTINE_THRESHOLD = 66;
export const SUSPICIOUS_THRESHOLD = 31;
export const VETO_THRESHOLD = 80;
export const VETO_ELIGIBLE_LAYERS = new Set([1, 5, 6]);
export const LAYER_WEIGHTS: Record<number, number> = {
  1: 1.8, 2: 1.3, 3: 1.2, 4: 1.4, 5: 2.0, 6: 1.9, 7: 1.1,
};
export const LAYER_NAMES: Record<number, string> = {
  1: "Envelope", 2: "Reputation", 3: "Headers",
  4: "Linguistics", 5: "Impersonation", 6: "Links", 7: "Behavioral",
};
