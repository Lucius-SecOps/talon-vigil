import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

const LAYERS = [
  { id: 1, name: "Envelope Analysis",           severity: "Critical", mult: "1.8x", veto: true,  detail: "Before reading a single word, TalonVigil checks the authentication envelope. SPF, DKIM, and DMARC failures are caught here — the sender equivalent of a forged ID." },
  { id: 2, name: "Sender Reputation",           severity: "High",     mult: "1.3x", veto: false, detail: "Authentication passing doesn't mean the sender is trustworthy. We cross-reference the sending domain and IP against Google Safe Browsing, IPQualityScore, and domain age heuristics." },
  { id: 3, name: "Header Forensics",            severity: "High",     mult: "1.2x", veto: false, detail: "Email headers contain the full routing history of a message. We look for relay chain anomalies, Message-ID irregularities, and Reply-To domain mismatches." },
  { id: 4, name: "Linguistic Pressure Mapping", severity: "High",     mult: "1.4x", veto: false, detail: "Social engineers use predictable psychological levers: urgency, authority, fear, scarcity, and reciprocity. We scan against a weighted library of 100+ pressure phrases across all five archetypes." },
  { id: 5, name: "Identity Impersonation",      severity: "Critical", mult: "2.0x", veto: true,  detail: "The highest-weight layer. We run Levenshtein distance scoring against the top 50 most-impersonated brands, detect Unicode homoglyph substitution, and flag display-name spoofing." },
  { id: 6, name: "Link & Payload Intel",        severity: "Critical", mult: "1.9x", veto: true,  detail: "Every URL is analyzed for entropy patterns, anchor mismatch, and cross-referenced against Google Safe Browsing, PhishTank, and URLhaus. One confirmed-malicious URL = immediate veto." },
  { id: 7, name: "Behavioral Context",          severity: "Medium",   mult: "1.1x", veto: false, detail: "The only layer that knows your inbox. We build a behavioral baseline per sender and flag deviations: first contact, unusual send time, volume spikes, and geographic origin shifts." },
  { id: 8, name: "Composite EAA Gate",          severity: "Gate",     mult: "—",    veto: false, detail: "Layer 8 is the judge, not a witness. Weighted scores from all 7 layers normalize to a 0–100 composite. The result maps to SAFE / SUSPICIOUS / QUARANTINE with a full human-readable threat report card." },
]

const SEV: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-400 border border-red-500/20",
  High:     "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  Medium:   "bg-green-500/10 text-green-400 border border-green-500/20",
  Gate:     "bg-[#00C2D4]/10 text-[#00C2D4] border border-[#00C2D4]/20",
}

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold mb-4">How TalonVigil Works</h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">Every email stands trial across 8 independent layers. No single layer is enough. Power comes from the composite.</p>
        </div>
        <div className="space-y-6">
          {LAYERS.map((layer) => (
            <div key={layer.id} className="border border-[#00C2D4]/15 bg-white/[0.02] rounded-lg p-6 flex gap-6 items-start">
              <div className="shrink-0 w-10 h-10 rounded-full bg-[#00C2D4]/10 border border-[#00C2D4]/20 flex items-center justify-center font-mono font-bold text-[#00C2D4]">
                {layer.id === 8 ? "⚖" : layer.id}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg">{layer.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEV[layer.severity]}`}>{layer.severity}</span>
                  {layer.mult !== "—" && <span className="font-mono text-xs text-[#00C2D4] bg-[#00C2D4]/5 border border-[#00C2D4]/15 px-2 py-0.5 rounded">{layer.mult} weight</span>}
                  {layer.veto && <span className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded">Veto-eligible</span>}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{layer.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center border border-[#00C2D4]/20 rounded-lg p-10 bg-[#00C2D4]/5">
          <h2 className="text-2xl font-bold mb-3">Every Decision Is EAA</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">Explainable. Auditable. Actionable. You always see exactly which layers fired, what was found, and what to do about it.</p>
          <a href="#" className="bg-[#00C2D4] text-[#0D1B2A] font-bold px-8 py-3 rounded hover:bg-[#33d4e3] transition-colors">Try It Free</a>
        </div>
      </div>
      <Footer />
    </div>
  )
}
