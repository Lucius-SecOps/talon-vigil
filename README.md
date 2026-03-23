# TalonVigil v2

**8-Layer Heuristic Email Security Engine**
Enterprise-grade email intelligence. Not enterprise-grade pricing.

---

## Architecture

```
Frontend (React/Vite/Tailwind) → Vercel
Backend  (FastAPI/Python)      → DigitalOcean Droplet
Database (PostgreSQL/Auth)     → Supabase
Queue    (Redis/Celery)        → DigitalOcean (same droplet, v1)
DNS      (talonvigil.com)      → Cloudflare → Vercel
```

## The 8 Layers

| # | Layer | Severity | Multiplier | Veto |
|---|---|---|---|---|
| L1 | Envelope Analysis | Critical | 1.8× | ✓ |
| L2 | Sender Reputation | High | 1.3× | — |
| L3 | Header Forensics | High | 1.2× | — |
| L4 | Linguistic Pressure | High | 1.4× | — |
| L5 | Identity Impersonation | **Critical** | **2.0×** | ✓ |
| L6 | Link & Payload | Critical | 1.9× | ✓ |
| L7 | Behavioral Context | Medium | 1.1× | — |
| L8 | Composite + EAA Gate | — | — | — |

Every quarantine decision is **Explainable, Auditable, and Actionable**.

## Quick Start

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # fill in your keys
uvicorn main:app --reload

# Frontend
cd frontend
npm install
cp ../.env.example .env.local
npm run dev
```

## Environment Variables
See `.env.example` in the repo root.

## Pricing
| Tier | Price | Scans |
|---|---|---|
| Scout | Free | 500/mo |
| Shield | $7/mo | Unlimited |
| Sentinel | $10/mo/seat | Unlimited + team |

## Claude Project Skills
All 8 Claude Project skill files are in `/skills/`.
Load them into a Claude Project along with `TalonVigil_8Layer_Spec_Draft2.docx`
before starting any build session.
