# advertise.muslimadnetwork.com

Self-service ad-campaign onboarding platform for Muslim Ad Network advertisers.
Rebuilt from base44 to a fully server-controlled Laravel + Next.js stack.

## Stack

| Layer    | Tech                    |
|----------|-------------------------|
| Backend  | Laravel 11 (port 8004)  |
| Frontend | Next.js 16 — App Router (port 3004) |
| Database | MySQL 8.0 — `advertise_muslimadnetwork` |
| Cache/Queue | Redis               |
| Auth     | UmmahPass SSO + Sanctum |
| Payments | Stripe + PayPal         |

## Developer guide

See [CLAUDE.md](./CLAUDE.md) for the full session plan, data model, API
endpoints, design system, and workflow rules.

## Paths

- Backend: `backend/`
- Frontend: `frontend/`
- Base44 reference source (gitignored): `_base44-reference/`
