import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { CheckCircle, X } from 'lucide-react'

const TIERS = [
  {
    tier: "Scout", price: "Free", per: "", target: "Individual prosumers", highlight: false,
    features: [
      { name: "Gmail integration", included: true },
      { name: "500 scans/month (~16/day)", included: true },
      { name: "Basic quarantine folder", included: true },
      { name: "Threat classification label", included: true },
      { name: "All providers (Outlook, Yahoo, Zoho)", included: false },
      { name: "Full EAA threat report card", included: false },
      { name: "Audit log", included: false },
      { name: "Team dashboard", included: false },
    ]
  },
  {
    tier: "Shield", price: "$7", per: "/mo", target: "Power users", highlight: false,
    features: [
      { name: "All providers (Gmail, Outlook, Zoho)", included: true },
      { name: "Unlimited scans", included: true },
      { name: "Full EAA threat report card", included: true },
      { name: "< 10 second scan latency", included: true },
      { name: "Per-email layer breakdown", included: true },
      { name: "Audit log", included: false },
      { name: "Team dashboard", included: false },
      { name: "Priority support", included: false },
    ]
  },
  {
    tier: "Sentinel", price: "$10", per: "/mo per seat", target: "SMBs & nonprofits", highlight: true,
    features: [
      { name: "Everything in Shield", included: true },
      { name: "Team dashboard & admin controls", included: true },
      { name: "Full audit log (compliance-ready)", included: true },
      { name: "< 5 second scan latency", included: true },
      { name: "Priority processing queue", included: true },
      { name: "Priority support", included: true },
      { name: "Nonprofit discount available", included: true },
      { name: "Volume pricing for 10+ seats", included: true },
    ]
  }
]

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold mb-4">Simple Pricing</h1>
          <p className="text-gray-400 text-xl max-w-lg mx-auto">Enterprise tools charge $30–50/month per seat. We cap at $10. That's the whole pitch.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {TIERS.map(({ tier, price, per, target, highlight, features }) => (
            <div key={tier} className={`rounded-lg p-7 ${highlight ? "border-2 border-[#00C2D4] bg-[#00C2D4]/5 relative" : "border border-[#00C2D4]/15 bg-white/[0.02]"}`}>
              {highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00C2D4] text-[#0D1B2A] text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>}
              <div className="font-bold text-2xl mb-1">{tier}</div>
              <div className="flex items-baseline gap-0.5 mb-1">
                <span className="text-4xl font-extrabold text-[#00C2D4]">{price}</span>
                <span className="text-gray-400 text-sm">{per}</span>
              </div>
              <div className="text-gray-400 text-sm mb-8">{target}</div>
              <ul className="space-y-3 mb-8">
                {features.map(({ name, included }) => (
                  <li key={name} className="flex items-start gap-2.5 text-sm">
                    {included ? <CheckCircle className="text-[#00C2D4] w-4 h-4 shrink-0 mt-0.5" /> : <X className="text-gray-600 w-4 h-4 shrink-0 mt-0.5" />}
                    <span className={included ? "text-gray-200" : "text-gray-500"}>{name}</span>
                  </li>
                ))}
              </ul>
              <a href="#" className={`block text-center py-3 rounded font-semibold text-sm transition-colors ${highlight ? "bg-[#00C2D4] text-[#0D1B2A] hover:bg-[#33d4e3]" : "border border-[#00C2D4]/30 text-[#00C2D4] hover:bg-[#00C2D4]/5"}`}>
                {tier === "Scout" ? "Start Free" : `Get ${tier}`}
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-500 text-sm mt-10">Nonprofit? Contact us for mission-aligned pricing.</p>
      </div>
      <Footer />
    </div>
  )
}
