import { useState } from 'react'
import { RotateCw } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ThreatScoreCard from '../components/ThreatScoreCard'
import { runSampleScan, ApiError } from '../lib/api'
import type { ScanResult } from '../types/scan'

type Kind = 'quarantine' | 'suspicious' | 'safe' | 'veto'
type Status = 'idle' | 'loading' | 'ready' | 'error'

const SAMPLES: { kind: Kind; label: string }[] = [
  { kind: 'quarantine', label: 'Fake invoice' },
  { kind: 'suspicious', label: 'Bank-detail change' },
  { kind: 'safe', label: 'Real client email' },
  { kind: 'veto', label: 'Malware link (veto)' },
]

/**
 * /scan — the EAA report card in action. Runs a sample email through the real
 * POST /api/scan/ endpoint (Supabase-authed), falling back to a bundled sample
 * result when unauthenticated or the backend is down, then renders the full
 * report with the scanning animation.
 */
export default function ScanReport() {
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [live, setLive] = useState(false)
  const [errCode, setErrCode] = useState('SC-500')
  const [lastKind, setLastKind] = useState<Kind>('quarantine')

  async function run(kind: Kind) {
    setLastKind(kind)
    setStatus('loading')
    setResult(null)
    try {
      const { result: r, live: isLive } = await runSampleScan(kind)
      setResult(r)
      setLive(isLive)
      setStatus('ready')
    } catch (e) {
      setErrCode(e instanceof ApiError ? e.code : 'SC-500')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#00C2D4]/10 border border-[#00C2D4]/20 rounded-full px-4 py-1.5 text-[#00C2D4] text-sm font-medium mb-6">
            Explainable AI Audit
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">See a scan, end to end</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Run a sample email through all eight layers and watch exactly how the verdict is reached — every score, every reason, nothing hidden.
          </p>
        </div>

        {/* Sample chooser */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-10">
          {SAMPLES.map((s) => (
            <button
              key={s.kind}
              onClick={() => run(s.kind)}
              className="border border-[#00C2D4]/30 text-[#00C2D4] font-mono text-xs px-4 py-2.5 rounded hover:bg-[#00C2D4]/5 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        {status === 'idle' && (
          <div className="border border-dashed border-gray-500/40 rounded-lg p-8 text-center text-gray-400">
            Pick a sample above to run a scan.
          </div>
        )}

        {status === 'loading' && (
          <div className="border border-[#00C2D4]/20 bg-white/[0.02] rounded-lg p-6 flex items-center gap-3">
            <RotateCw size={16} className="text-[#00C2D4] animate-spin" />
            <span className="font-mono text-xs tracking-[0.14em] text-[#00C2D4]">CONTACTING SCAN ENGINE…</span>
          </div>
        )}

        {status === 'error' && (
          <div className="border border-dashed border-gray-500/40 rounded-lg p-8 flex flex-col items-start gap-4">
            <span className="font-mono text-[11px] tracking-wider text-gray-300 border border-dashed border-gray-500/40 rounded px-2 py-1">
              SCAN NOT COMPLETED
            </span>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xl">
              We couldn't finish this scan — error {errCode}, on our side. No verdict was reached, so we're not guessing one.
              The email was left exactly where it was, untouched. Nothing was quarantined on a hunch.
            </p>
            <p className="font-mono text-xs text-gray-500">this failure is logged in your audit trail like any other event</p>
            <button onClick={() => run(lastKind)} className="border border-[#00C2D4]/30 text-[#00C2D4] font-semibold text-sm px-5 py-2.5 rounded hover:bg-[#00C2D4]/5 transition-colors">
              <RotateCw size={12} className="inline mr-1.5" /> Run scan again
            </button>
          </div>
        )}

        {status === 'ready' && result && (
          <div className="flex flex-col gap-3">
            {!live && (
              <p className="font-mono text-[11px] text-gray-500">
                showing a bundled sample — sign in and run the backend for a live verdict
              </p>
            )}
            <ThreatScoreCard key={result.scan_id} result={result} scanning />
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
