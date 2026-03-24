import { Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0D1B2A]/90 backdrop-blur border-b border-[#00C2D4]/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Shield className="text-[#00C2D4] w-5 h-5" />
          <span className="text-white">Talon<span className="text-[#00C2D4]">Vigil</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
          <Link to="/how-it-works" className="hover:text-[#00C2D4] transition-colors">How It Works</Link>
          <Link to="/pricing" className="hover:text-[#00C2D4] transition-colors">Pricing</Link>
          <a href="#" className="hover:text-[#00C2D4] transition-colors">Docs</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Log in</a>
          <a href="#" className="bg-[#00C2D4] text-[#0D1B2A] font-semibold text-sm px-4 py-2 rounded hover:bg-[#33d4e3] transition-colors">
            Start Free
          </a>
        </div>
      </div>
    </nav>
  )
}
