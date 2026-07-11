/**
 * ScanDemo — manual "paste an email, run it through all 8 layers" page.
 *
 * Doubles as a real feature (useful for testing/exploring the engine
 * directly) and as the first place a genuine ThreatScoreCard ever
 * renders a genuine scan result, rather than the Landing page's
 * scripted hero demo.
 *
 * Gated by a lightweight magic-link sign-in built directly into this
 * page — there's no dedicated login page yet, and /api/scan/ requires
 * a real Supabase session. Whichever page eventually owns the full
 * sign-up/login UX can replace this; it's a stopgap, not the final home
 * for auth.
 */
import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { scanEmail, ApiError, type ScanResponse } from '../lib/apiClient'
import ThreatScoreCard from '../components/ThreatScoreCard'

function errorMessageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Your session expired. Sign in again to keep scanning.'
    if (err.status === 429) return "You've hit the scan limit for now. Try again in a minute."
    if (err.status >= 500) return "The scan couldn't complete. Try again in a moment."
  }
  return "The scan couldn't complete. Try again in a moment."
}

export default function ScanDemo() {
  const { user, loading: authLoading } = useAuth()

  // ── Magic-link sign-in (stopgap — see file header) ────────────────
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null)

  async function handleSendMagicLink(e: FormEvent) {
    e.preventDefault()
    setMagicLinkError(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setMagicLinkError(error.message)
    } else {
      setMagicLinkSent(true)
    }
  }

  // ── Scan form ──────────────────────────────────────────────────────
  const [fromAddress, setFromAddress] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [rawHeaders, setRawHeaders] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResponse | null>(null)

  async function handleScan(e: FormEvent) {
    e.preventDefault()
    setScanning(true)
    setScanError(null)
    setResult(null)
    try {
      const response = await scanEmail({
        raw_headers: rawHeaders,
        from_address: fromAddress,
        subject,
        body_text: bodyText,
      })
      setResult(response)
    } catch (err) {
      setScanError(errorMessageFor(err))
    } finally {
      setScanning(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <p className="text-white/40 text-sm font-mono motion-safe:animate-scan-pulse">
          Checking your session…
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy px-4">
        <div className="card-cyber max-w-md w-full">
          <h1 className="text-xl font-semibold text-white mb-2">Sign in to scan an email</h1>
          <p className="text-sm text-white/60 mb-6">
            We&apos;ll email you a one-time link. No password needed.
          </p>
          {magicLinkSent ? (
            <p className="text-sm text-safe">Check your inbox for a sign-in link.</p>
          ) : (
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-cyan/25 bg-white/5 px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan"
              />
              {magicLinkError && <p className="text-sm text-quarantine">{magicLinkError}</p>}
              <button type="submit" className="btn-primary w-full">
                Send magic link
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Scan an Email</h1>
          <p className="text-white/60 text-sm">
            Paste in the details. We&apos;ll run all 8 layers and show you exactly why.
          </p>
        </div>

        <form onSubmit={handleScan} className="card-cyber space-y-4">
          <div>
            <label htmlFor="from_address" className="block text-sm text-white/70 mb-1">
              From address
            </label>
            <input
              id="from_address"
              type="text"
              required
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              placeholder="alerts@paypa1-secure.net"
              className="w-full rounded border border-cyan/25 bg-white/5 px-4 py-2 text-white placeholder-white/30 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm text-white/70 mb-1">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your account will be suspended"
              className="w-full rounded border border-cyan/25 bg-white/5 px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <div>
            <label htmlFor="body_text" className="block text-sm text-white/70 mb-1">
              Body text
            </label>
            <textarea
              id="body_text"
              required
              rows={5}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Act now — your account will be suspended within 24 hours..."
              className="w-full rounded border border-cyan/25 bg-white/5 px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </div>

          <details className="text-sm">
            <summary className="text-white/50 cursor-pointer select-none">
              Advanced: raw headers (optional)
            </summary>
            <label htmlFor="raw_headers" className="sr-only">
              Raw headers
            </label>
            <textarea
              id="raw_headers"
              rows={4}
              value={rawHeaders}
              onChange={(e) => setRawHeaders(e.target.value)}
              placeholder="Authentication-Results: spf=fail; dkim=none; dmarc=fail"
              className="w-full mt-2 rounded border border-cyan/25 bg-white/5 px-4 py-2 text-white placeholder-white/30 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan"
            />
          </details>

          {scanError && <p className="text-sm text-quarantine">{scanError}</p>}

          <button
            type="submit"
            disabled={scanning}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanning ? (
              <span className="motion-safe:animate-scan-pulse">Running 8 layers…</span>
            ) : (
              'Scan Email'
            )}
          </button>
        </form>

        {result && <ThreatScoreCard result={result} />}
      </div>
    </div>
  )
}
