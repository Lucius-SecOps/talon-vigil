import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { Shield, Eye, FileCheck, Lock, ChevronRight, CheckCircle } from 'lucide-react'

const LAYERS = [
  { id: 1, name: "Envelope Analysis",            severity: "Critical", mult: "1.8x", desc: "SPF, DKIM, DMARC authentication + return-path verification" },
  { id: 2, name: "Sender Reputation",            severity: "High",     mult: "1.3x", desc: "Domain age, IP blacklists, registration anomaly detection" },
  { id: 3, name: "Header Forensics",             severity: "High",     mult: "1.2x", desc: "Routing irregularities, relay chain anomalies, time inconsistencies" },
  { id: 4, name: "Linguistic Pressure Mapping",  severity: "High",     mult: "1.4x", desc: "Urgency, authority, fear, scarcity, and reciprocity trigger detection" },
  { id: 5, name: "Identity Impersonation",       severity: "Critical", mult: "2.0x", desc: "Lookalike domains, display name spoofing, Unicode homoglyphs" },
  { id: 6, name: "Link & Payload Intel",         severity: "Critical", mult: "1.9x", desc: "URL entropy scoring, Safe Browsing lookup, anchor mismatch detection" },
  { id: 7, name: "Behavioral Context Engine",    severity: "Medium",   mult: "1.1x", desc: "Sender history, timing anomalies, first-contact flagging" },
  { id: 8, name: "Composite EAA Gate",           severity: "Gate",     mult: "—",    desc: "Weighted aggregate → quarantine decision + full threat report card" },
]

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "text-red-400 bg-red-400/10 border-red-400/20",
  High:     "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Medium:   "text-green-400 bg-green-400/10 border-green-400/20",
  Gate:     "text-[#00C2D4] bg-[#00C2D4]/10 border-[#00C2D4]/20",
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">
      <Navbar />
      <section className="pt-32 pb-24 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-[#00C2D4]/10 border border-[#00C2D4]/20 rounded-full px-4 py-1.5 text-[#00C2D4] text-sm font-medium mb-8">
          <Shield className="w-4 h-4" /> 8-Layer Heuristic Engine
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          The email threats
          <br />
          <span className="text-[#00C2D4]">Google missed.</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
          TalonVigil intercepts spam, phishing, and advanced social engineering attacks before
          they reach your inbox — with a transparent, layered threat report on every decision.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#" className="bg-[#00C2D4] text-[#0D1B2A] font-bold px-8 py-4 rounded text-lg hover:bg-[#33d4e3] transition-colors flex items-center gap-2 justify-center">
            Start Free — Gmail in 60 seconds <ChevronRight className="w-5 h-5" />
          </a>
          <a href="/how-it-works" className="border border-[#00C2D4]/30 text-[#00C2D4] font-semibold px-8 py-4 rounded text-lg hover:bg-[#00C2D4]/5 transition-colors">
            See How It Works
          </a>
        </div>
        <p className="mt-4 text-gray-500 text-sm">No credit card required. Scout tier is free forever.</p>
      </section>

      <section className="border-y border-[#00C2D4]/10 py-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { stat: "$2.77B", label: "BEC losses in 2024 (FBI IC3)" },
            { stat: "88%",    label: "Google systems bypassable (ACM 2024)" },
            { stat: "8",      label: "Detection layers per email" },
            { stat: "$10/mo", label: "Max price. Per seat. Period." },
          ].map(({ stat, label }) => (
            <div key={stat}>
              <div className="text-3xl font-extrabold text-[#00C2D4]">{stat}</div>
              <div className="text-gray-400 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4">The 8-Layer Model</h2>
          <p className="text-gray-400 max-w-xl mx-auto">No single layer is sufficient. Power comes from the composite. Every decision includes the full transcript.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {LAYERS.map((layer) => (
            <div key={layer.id} className="border border-[#00C2D4]/15 bg-white/[0.02] rounded-lg p-5 flex gap-4 items-start hover:border-[#00C2D4]/30 transition-colors">
              <div className="text-[#00C2D4] font-mono font-bold text-lg w-8 shrink-0">L{layer.id}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold">{layer.name}</span>
                  <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${SEVERITY_COLORS[layer.severity]}`}>{layer.severity}</span>
                  {layer.mult !== "—" && <span className="text-xs text-[#00C2D4] font-mono">{layer.mult}</span>}
                </div>
                <p className="text-gray-400 text-sm">{layer.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 bg-[#132436]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Every Decision Is <span className="text-[#00C2D4]">EAA</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">Explainable. Auditable. Actionable. No black boxes, ever.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Eye,       title: "Explainable",  desc: "Every quarantine shows you which layers fired, what signal was found, and why it matters — in plain language." },
              { icon: FileCheck, title: "Auditable",    desc: "Every decision is logged with timestamp, per-layer scores, weights, composite score, and action taken." },
              { icon: Lock,      title: "Actionable",   desc: "Three clear options on every quarantined email: Release to Inbox, Keep Quarantined, or Report as Phishing." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border border-[#00C2D4]/15 bg-white/[0.02] rounded-lg p-8 text-center">
                <Icon className="text-[#00C2D4] w-10 h-10 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold mb-4">Priced for the Little Guy</h2>
        <p className="text-gray-400 mb-12 max-w-lg mx-auto">Enterprise tools charge $30–50/mo per seat. We charge $10. Maximum.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { tier: "Scout",    price: "Free",   target: "Prosumers",         highlight: false, features: ["Gmail only", "500 scans/mo", "Basic quarantine", "Threat labels"] },
            { tier: "Shield",   price: "$7/mo",  target: "Power users",       highlight: false, features: ["All providers", "Unlimited scans", "Full EAA report card", "< 10s latency"] },
            { tier: "Sentinel", price: "$10/mo", target: "SMBs & nonprofits", highlight: true,  features: ["Everything in Shield", "Team dashboard", "Audit logs", "< 5s latency", "Priority support"] },
          ].map(({ tier, price, target, highlight, features }) => (
            <div key={tier} className={`rounded-lg p-6 text-left ${highlight ? "border-2 border-[#00C2D4] bg-[#00C2D4]/5" : "border border-[#00C2D4]/15 bg-white/[0.02]"}`}>
              {highlight && <div className="text-xs font-bold text-[#00C2D4] mb-2 tracking-widest">MOST POPULAR</div>}
              <div className="text-2xl font-extrabold mb-1">{tier}</div>
              <div className="text-3xl font-extrabold text-[#00C2D4] mb-1">{price}</div>
              <div className="text-gray-400 text-sm mb-6">{target}</div>
              <ul className="space-y-2">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="text-[#00C2D4] w-4 h-4 shrink-0" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
              <a href="#" className={`mt-6 block text-center py-3 rounded font-semibold text-sm transition-colors ${highlight ? "bg-[#00C2D4] text-[#0D1B2A] hover:bg-[#33d4e3]" : "border border-[#00C2D4]/30 text-[#00C2D4] hover:bg-[#00C2D4]/5"}`}>
                Get Started
              </a>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  )
}
