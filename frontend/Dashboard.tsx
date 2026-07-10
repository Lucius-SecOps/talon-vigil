import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCw, ArrowUpDown } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { getScanHistory } from '../lib/api'
import type { ScanHistoryItem, Classification } from '../types/scan'

type Status = 'loading' | 'ready' | 'error'
type Filter = 'all' | Classification

// This repo's pages use hardcoded hex + Tailwind built-in semantics. Match that.
const CLASS_HEX: Record<Classification, string> = {
  SAFE: '#22c55e', SUSPICIOUS: '#f59e0b', QUARANTINE: '#ef4444', VETO: '#a855f7',
}
const FILTERS: Filter[] = ['all', 'SAFE', 'SUSPICIOUS', 'QUARANTINE', 'VETO']

function layerHex(score: number, veto: boolean) {
  if (veto) return '#a855f7'
  return score > 65 ? '#ef4444' : score > 30 ? '#f59e0b' : '#22c55e'
}
function relTime(iso: string) {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return d === 1 ? 'yesterday' : `${d}d ago`
}

/**
 * /dashboard — scan history. Reads the user's scan_records from Supabase (falls
 * back to typed mock data when unconfigured / signed out). Filter by classification,
 * sort by newest or score, with dedicated loading / empty / error states.
 */
export default function Dashboard() {
  const [status, setStatus] = useState<Status>('loading')
  const [items, setItems] = useState<ScanHistoryItem[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [sortByScore, setSortByScore] = useState(false)

  async function load() {
    setStatus('loading')
    try {
      setItems(await getScanHistory())
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }
  useEffect(() => { load() }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    for (const cls of ['SAFE', 'SUSPICIOUS', 'QUARANTINE', 'VETO']) c[cls] = items.filter((i) => i.classification === cls).length
    return c
  }, [items])

  const visible = useMemo(() => {
    let list = filter === 'all' ? items : items.filter((i) => i.classification === filter)
    if (sortByScore) list = [...list].sort((a, b) => b.composite_score - a.composite_score)
    return list
  }, [items, filter, sortByScore])

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">
      <Navbar />
      <div className="pt-28 pb-24 px-6 max-w-4xl mx-auto">
        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-1.5">Scan history</h1>
            <p className="text-gray-400 text-sm">
              Every verdict, on the record. Forward anything suspicious to <span className="font-mono text-[13px] text-[#00C2D4]">scan@talonvigil.com</span>
            </p>
          </div>
          <Link to="/scan" className="bg-[#00C2D4] text-[#0D1B2A] font-semibold text-sm px-5 py-2.5 rounded hover:bg-[#33d4e3] transition-colors text-center">
            Scan an email
          </Link>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div className="space-y-2.5">
            <p className="font-mono text-xs tracking-[0.14em] text-[#00C2D4] px-1 py-1">LOADING HISTORY…</p>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border border-white/[0.06] bg-white/[0.02] rounded-lg p-5 grid grid-cols-[64px_110px_1fr] gap-4 items-center animate-pulse">
                <div className="h-6 rounded bg-white/5" />
                <div className="h-4 rounded bg-white/5" />
                <div className="h-4 w-3/5 rounded bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {/* Load error — framed as our gap, never like a threat */}
        {status === 'error' && (
          <div className="border border-dashed border-gray-500/40 rounded-lg p-8 flex flex-col items-start gap-4">
            <span className="font-mono text-[11px] tracking-wider text-gray-300 border border-dashed border-gray-500/40 rounded px-2 py-1">LOG VIEW UNAVAILABLE</span>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xl">
              Your history didn't load — error HX-503, on our side. Scanning itself is unaffected: mail is still being checked and quarantined while this view is down.
            </p>
            <button onClick={load} className="border border-[#00C2D4]/30 text-[#00C2D4] font-semibold text-sm px-5 py-2.5 rounded hover:bg-[#00C2D4]/5 transition-colors">
              <RotateCw size={12} className="inline mr-1.5" /> Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {status === 'ready' && items.length === 0 && (
          <div className="border border-[#00C2D4]/20 bg-white/[0.02] rounded-lg px-6 md:px-12 py-16 text-center flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 mb-2">
              {[10, 14, 18, 14, 10].map((s, i) => (
                <span key={i} className="block rotate-45 bg-[#00C2D4]" style={{ width: s, height: s, opacity: i === 2 ? 1 : 0.4, boxShadow: i === 2 ? '0 0 20px rgba(0,194,212,0.6)' : 'none' }} />
              ))}
            </div>
            <h2 className="text-2xl md:text-[28px] font-extrabold">Nothing scanned. Nothing hidden.</h2>
            <p className="text-gray-400 max-w-md leading-relaxed">
              Your audit log is empty — either nothing has tried to fool you yet, or you haven't let us look. Forward any email to <span className="font-mono text-sm text-[#00C2D4]">scan@talonvigil.com</span> and you'll have your first report card in about ten seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
              <Link to="/connect" className="bg-[#00C2D4] text-[#0D1B2A] font-bold px-6 py-3 rounded hover:bg-[#33d4e3] transition-colors">Connect a mailbox</Link>
              <Link to="/scan" className="font-mono text-[13px] text-[#00C2D4] hover:text-[#33d4e3]">or dissect a real phish (defanged) →</Link>
            </div>
          </div>
        )}

        {/* History list */}
        {status === 'ready' && items.length > 0 && (
          <div className="flex flex-col gap-4">
            {/* Filters + sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => {
                  const active = filter === f
                  const hex = f === 'all' ? '#00C2D4' : CLASS_HEX[f as Classification]
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className="flex items-center gap-2 rounded border px-3.5 py-1.5 font-mono text-xs tracking-wide transition-colors"
                      style={{
                        color: active ? hex : '#9ca3af',
                        borderColor: active ? `${hex}99` : 'rgba(255,255,255,0.12)',
                        backgroundColor: active ? `${hex}14` : 'transparent',
                      }}
                    >
                      <span>{f === 'all' ? 'ALL' : f}</span>
                      <span className="opacity-60">{counts[f]}</span>
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setSortByScore((v) => !v)} className="flex items-center gap-1.5 font-mono text-xs text-[#00C2D4] hover:text-[#33d4e3]">
                SORT: {sortByScore ? 'SCORE' : 'NEWEST'} <ArrowUpDown size={12} />
              </button>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2.5">
              {visible.map((rec) => {
                const hex = CLASS_HEX[rec.classification]
                return (
                  <div
                    key={rec.scan_id}
                    className="grid grid-cols-[52px_1fr_auto] sm:grid-cols-[64px_110px_1fr_auto_auto] items-center gap-x-3 gap-y-2.5 sm:gap-4 rounded-lg border bg-white/[0.02] p-3.5 sm:px-5 transition-colors hover:border-[#00C2D4]/40"
                    style={{ borderColor: rec.classification === 'VETO' ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)' }}
                  >
                    <div className="row-span-2 sm:row-span-1 flex flex-col items-center">
                      <span className="font-mono text-2xl font-bold" style={{ color: hex }}>{rec.composite_score.toFixed(0)}</span>
                      <span className="font-mono text-[9px] tracking-wider text-white/40">/100</span>
                    </div>
                    <div
                      className="col-start-3 row-start-1 justify-self-end sm:col-auto sm:row-auto sm:justify-self-auto inline-flex items-center rounded px-2 py-1"
                      style={{ color: hex, backgroundColor: `${hex}14`, border: `1px solid ${hex}33` }}
                    >
                      <span className="font-mono text-[10px] font-bold tracking-wider">{rec.classification}</span>
                    </div>
                    <div className="col-start-2 row-start-1 sm:col-auto sm:row-auto min-w-0">
                      <div className="truncate text-[15px] font-semibold">{rec.subject}</div>
                      <div className="truncate font-mono text-xs text-white/40">{rec.from_address}</div>
                    </div>
                    <div className="col-span-2 col-start-2 sm:col-auto flex items-end gap-[3px] h-6" title="7-layer profile">
                      {rec.layers.map((l) => (
                        <span key={l.layer} className="w-1.5 rounded-sm opacity-90" style={{ height: `${Math.max(3, (l.score / 100) * 24)}px`, backgroundColor: layerHex(l.score, l.veto) }} />
                      ))}
                    </div>
                    <div className="col-span-2 col-start-2 sm:col-auto flex items-center justify-between sm:flex-col sm:items-end sm:gap-1">
                      <Link to="/scan" className="font-mono text-[11px] tracking-wide text-[#00C2D4] hover:text-[#33d4e3]">VIEW AUDIT →</Link>
                      <span className="font-mono text-[11px] text-white/40">{relTime(rec.received_at)}</span>
                    </div>
                  </div>
                )
              })}
              {visible.length === 0 && (
                <div className="border border-dashed border-gray-500/40 rounded-lg p-10 text-center font-mono text-[13px] text-gray-400">
                  No scans match this filter — which, for this one, is good news.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
