import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Landing from './pages/Landing'
import Pricing from './pages/Pricing'
import HowItWorks from './pages/HowItWorks'
import ScanDemo from './pages/ScanDemo'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/scan" element={<ScanDemo />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
