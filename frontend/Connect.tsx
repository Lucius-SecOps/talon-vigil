import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { LAYER_NAMES } from '../types/scan'

type Provider = 'gmail' | 'outlook'
type Phase = 'choose' | 'success'

const PROVIDERS: Record<Provider, { name: string; sub: string; glyph: string; scope: string; authHost: string }> = {
  gmail:   { name: 'Gmail',   sub: 'Google Workspace or personal', glyph: 'G', scope: 'gmail.modify',  authHost: 'accounts.google.com' },
  outlook: { name: 'Outlook', sub: 'Microsoft 365 or personal',   glyph: 'O', scope: 'Mail.ReadWrite', authHost: 'login.microsoftonline.com' },
}
const SCOPE_WHY = 'Read incoming mail and move flagged messages to quarantine. This scope cannot send email as you or permanently delete anything.'
const TRUST = [
  { title: 'NOTHING STORED', body: 'We keep verdicts and metadata. Message bodies are scanned in memory and never written to disk.' },
  { title: 'EVERYTHING LOGGED', body: 'Every action we take in your mailbox lands in your audit log — the same log you already saw.' },
  { title: 'ONE-CLICK EXIT', body: "Disconnect anytime from settings — and revoke us from your provider's side too. No retention." },
]

const LAYER_IDS = [1, 2, 3, 4, 5, 6, 7]
const ARM_START = 1400
const ARM_GAP = 150
const PROTECT_AT = ARM_START + LAYER_IDS.length * ARM_GAP + 500

/**
 * /connect — mailbox onboarding. Spells out the exact OAuth scope requested and
 * what it can / can't do, then plays a success sequence in the product's own scan
 * idiom: the mailbox arms its 8 layers and locks into a MONITORED state.
 */
export default function Connect() {
  const [phase, setPhase] = useState<Phase>('choose')
  const [provider, setProvider] = useState<Provider>('gmail')
  const [elapsed, setElapsed] = useState(0)
  const timer = useRef<number>()

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current) }, [])

  function begin(p: Provider) {
    setProvider(p)
    setPhase('success')
    setElapsed(0)
    const t0 = performance.now()
    if (timer.current) window.clearInterval(timer.current)
    timer.current = window.setInterval(() => {
      const el = performance.now() - t0
      setElapsed(el)
      if (el > PROTECT_AT + 800 && timer.current) window.clearInterval(timer.current)
    }, 50)
  }
  function reset() {
    if (timer.current) window.clearInterval(timer.current)
    setPhase('choose')
    setElapsed(0)
  }

  const prov = PROVIDERS[provider]
  const protectedNow = elapsed >= PROTECT_AT
  const arming = phase === 'success' && elapsed >= ARM_START && !protectedNow

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        {phase === 'choose' ? (
          <div className="flex flex-col gap-10">
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Connect your mailbox</h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                One permission, spelled out below in full. You'll see exactly what we can touch — and exactly what we can't — before you grant anything.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {(Object.keys(PROVIDERS) as Provider[]).map((key) => {
                const p = PROVIDERS[key]
                return (
                  <div key={key} className="border border-[#00C2D4]/15 bg-white/[0.02] rounded-lg p-6 flex flex-col gap-5 hover:border-[#00C2D4]/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded border border-[#00C2D4]/20 bg-[#00C2D4]/10 flex items-center justify-center font-mono font-bold text-lg text-[#00C2D4]">{p.glyph}</div>
                      <div>
                        <div className="font-bold text-lg">{p.name}</div>
                        <div className="text-gray-500 text-[13px]">{p.sub}</div>
                      </div>
                    </div>

                    <div className="border border-white/[0.08] bg-[#0D1B2A]/40 rounded px-4 py-3.5 flex flex-col gap-2">
                      <span className="font-mono text-[11px] tracking-wider text-gray-500">REQUESTS</span>
                      <span className="font-mono text-sm font-bold text-[#00C2D4]">{p.scope}</span>
                      <span className="text-gray-300 text-sm leading-relaxed">{SCOPE_WHY}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-[10px] tracking-wider text-green-400">CAN</span>
                        <span className="flex items-center gap-2 text-gray-300"><Check size={13} className="text-green-400" /> Read incoming mail</span>
                        <span className="flex items-center gap-2 text-gray-300"><Check size={13} className="text-green-400" /> Quarantine flagged mail</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-[10px] tracking-wider text-red-400">CAN'T</span>
                        <span className="flex items-center gap-2 text-gray-300"><X size={13} className="text-red-400" /> Send email as you</span>
                        <span className="flex items-center gap-2 text-gray-300"><X size={13} className="text-red-400" /> Delete anything</span>
                      </div>
                    </div>

                    <button onClick={() => begin(key)} className="bg-[#00C2D4] text-[#0D1B2A] font-semibold text-sm px-6 py-3 rounded hover:bg-[#33d4e3] transition-colors">
                      Connect {p.name}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="grid md:grid-cols-3 gap-6 border-t border-[#00C2D4]/10 pt-6">
              {TRUST.map((t) => (
                <div key={t.title} className="flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] tracking-wider text-[#00C2D4]">{t.title}</span>
                  <span className="text-gray-400 text-sm leading-relaxed">{t.body}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 pt-4">
            {/* Mailbox entering monitored state */}
            <div
              className="relative w-full max-w-md flex items-center gap-4 overflow-hidden rounded-lg border bg-white/[0.02] px-6 py-5 transition-colors duration-500"
              style={{
                borderColor: protectedNow ? 'rgba(34,197,94,0.55)' : arming ? 'rgba(0,194,212,0.4)' : 'rgba(255,255,255,0.1)',
                boxShadow: protectedNow ? '0 0 32px rgba(34,197,94,0.25)' : 'none',
              }}
            >
              {arming && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-transparent via-[#00C2D4]/20 to-transparent animate-pulse" />}
              <div className="w-10 h-10 rounded border border-[#00C2D4]/20 bg-[#00C2D4]/10 flex items-center justify-center font-mono font-bold text-lg text-[#00C2D4]">{prov.glyph}</div>
              <div className="flex-1">
                <div className="font-mono text-sm">you@yourstudio.com</div>
                <div className="text-gray-500 text-[13px]">via {prov.name}</div>
              </div>
              <div
                className="inline-flex items-center gap-1.5 rounded border px-2.5 py-1 transition-all duration-500"
                style={{
                  color: protectedNow ? '#22c55e' : '#00C2D4',
                  borderColor: protectedNow ? 'rgba(34,197,94,0.5)' : 'rgba(0,194,212,0.4)',
                  backgroundColor: protectedNow ? 'rgba(34,197,94,0.08)' : 'rgba(0,194,212,0.06)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: protectedNow ? '#22c55e' : '#00C2D4' }} />
                <span className="font-mono text-[11px] font-bold tracking-wider">{protectedNow ? 'MONITORED' : arming ? 'ARMING' : 'LINKING'}</span>
              </div>
            </div>

            {/* Auth log + arming layers */}
            <div className="w-full max-w-md min-h-[240px] flex flex-col gap-2">
              {[
                { at: 100, text: `→ contacting ${prov.authHost} …`, cls: 'text-gray-500' },
                { at: 500, text: `→ requesting scope: ${prov.scope}`, cls: 'text-gray-500' },
                { at: 950, text: '✓ scope granted — read + quarantine only. send: denied. delete: denied.', cls: 'text-[#00C2D4]' },
              ].map((l) => (
                <div key={l.at} className={`font-mono text-xs transition-opacity ${l.cls} ${elapsed >= l.at ? 'opacity-100' : 'opacity-0'}`}>{l.text}</div>
              ))}
              {LAYER_IDS.map((id, i) => {
                const on = elapsed >= ARM_START + i * ARM_GAP
                const visible = elapsed >= ARM_START - 200
                return (
                  <div key={id} className={`grid grid-cols-[28px_1fr_auto] items-center gap-3 transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="font-mono text-[11px] text-gray-500">L{id}</span>
                    <span className={`text-sm transition-colors ${on ? 'text-white' : 'text-gray-500'}`}>{LAYER_NAMES[id]}</span>
                    <span className="font-mono text-[11px] tracking-wider" style={{ color: on ? '#22c55e' : '#6b7280' }}>{on ? '● ONLINE' : '○ standby'}</span>
                  </div>
                )
              })}
            </div>

            {/* Payoff */}
            <div className={`flex flex-col items-center gap-3.5 text-center transition-opacity duration-700 ${protectedNow ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="text-2xl md:text-[30px] font-extrabold">Your inbox is under watch.</h2>
              <p className="text-gray-400 max-w-md leading-relaxed">
                Eight layers armed. The first report card lands with your next email — and every verdict will explain itself.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-1.5">
                <Link to="/dashboard" className="bg-[#00C2D4] text-[#0D1B2A] font-bold px-6 py-3 rounded hover:bg-[#33d4e3] transition-colors">Go to dashboard</Link>
                <button onClick={reset} className="font-mono text-xs text-gray-500 hover:text-[#00C2D4]">← connect a different mailbox</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
