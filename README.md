# TalonVigil

Email scams are not just an enterprise problem anymore.
They hit families, freelancers, neighborhood businesses, and growing teams every day.

TalonVigil gives you practical, layered email threat detection without forcing you into expensive enterprise tooling.

## Why TalonVigil

- Catches suspicious messages before someone clicks the wrong link.
- Explains why a message was flagged so people can learn, not just panic.
- Gives small teams a security boost without needing a dedicated SOC.
- Helps everyday users protect personal accounts from phishing and impersonation.

## Built For

- Individuals who want safer personal inboxes.
- Freelancers and solo operators handling invoices, contracts, and client email.
- SMB teams that need stronger protection but still care about budget.

## How It Works

TalonVigil scans each email through an 8-layer heuristic engine:

| # | Layer | What It Looks For |
|---|---|---|
| L1 | Envelope Analysis | Routing anomalies and sender-domain mismatches |
| L2 | Sender Reputation | Known bad infrastructure and reputation signals |
| L3 | Header Forensics | SPF/DKIM/DMARC irregularities and forged metadata |
| L4 | Linguistic Pressure | Urgency, coercion, and social-engineering language |
| L5 | Identity Impersonation | Executive/vendor lookalike abuse and spoofing |
| L6 | Link & Payload | Suspicious URLs, redirects, and risky payload patterns |
| L7 | Behavioral Context | Unusual communication behavior and timing |
| L8 | Composite Decision | Final risk scoring and action gate |

Every decision is designed to be explainable and actionable.

## Value For SMBs

- Reduce phishing-related downtime and incident cleanup.
- Protect finance and operations workflows from fake invoice/payment requests.
- Improve team confidence with clear threat reasoning.
- Scale from a small team to a growing org without replacing your whole stack.

## Value For Everyday People

- Spot fake delivery, banking, and account-reset emails faster.
- Lower the chance of account takeovers from credential theft.
- Keep family members safer online with clearer warning signals.

## Quick Start

### 1) Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt
uvicorn main:app --reload
```

### 2) Start the frontend

```bash
cd ..
npm install
npm run dev
```

## Environment Setup

Create and populate your environment files before running in production.

- Backend uses environment settings loaded by the FastAPI app.
- Frontend uses Vite environment variables.

## Tech Stack

```text
Frontend: React + Vite + Tailwind
Backend:  FastAPI + Python
Data/Auth: Supabase
Queue:    Redis + Celery
Deploy:   Vercel + DigitalOcean + Cloudflare
```

## Pricing Positioning

TalonVigil is built to deliver strong practical protection at SMB-friendly cost.
Enterprise-grade outcomes should not require enterprise-only budgets.
