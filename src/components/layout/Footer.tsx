import { Shield } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-[#00C2D4]/10 py-12 mt-24">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg mb-2">
            <Shield className="text-[#00C2D4] w-5 h-5" />
            <span>Talon<span className="text-[#00C2D4]">Vigil</span></span>
          </div>
          <p className="text-gray-400 text-sm max-w-xs">
            Enterprise-grade email intelligence. Not enterprise-grade pricing.
          </p>
        </div>
        <div className="flex gap-16 text-sm text-gray-400">
          <div className="flex flex-col gap-2">
            <span className="text-white font-medium mb-1">Product</span>
            <a href="/how-it-works" className="hover:text-[#00C2D4] transition-colors">How It Works</a>
            <a href="/pricing" className="hover:text-[#00C2D4] transition-colors">Pricing</a>
            <a href="#" className="hover:text-[#00C2D4] transition-colors">Docs</a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-white font-medium mb-1">Legal</span>
            <a href="#" className="hover:text-[#00C2D4] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#00C2D4] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#00C2D4] transition-colors">Security</a>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-8 pt-6 border-t border-[#00C2D4]/10 text-xs text-gray-500">
        © {new Date().getFullYear()} TalonVigil — A Lucius Engine Product. All rights reserved.
      </div>
    </footer>
  )
}
