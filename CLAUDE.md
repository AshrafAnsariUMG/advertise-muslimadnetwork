# PROJECT: advertise.muslimadnetwork.com

**Type:** Migration from base44 (self-service ad-campaign onboarding platform)
**Operator:** Ummah Media Group LLC
**Developer:** Ashraf Ansari
**Status:** S1 complete (2026-05-20) — S2 (data layer) is next

---

## SOURCE OF TRUTH

This project is a rebuild of an existing base44 app. The original source code is at:

```
/var/www/advertise-muslimadnetwork/_base44-reference/
```

Always reference this directory when porting UI components, business logic, or
page layouts. Do NOT copy base44 SDK calls — they must be replaced with calls
to our new Laravel API. The reference is for visual/UX fidelity and business
logic only.

Original OpenAPI spec for the base44 backend is at:
```
/var/www/advertise-muslimadnetwork/_base44-reference/openapi-spec.json
```

---

## SERVER

- Provider: Hetzner VPS CX33
- IP: 37.27.215.90
- OS: Ubuntu 24.04 LTS
- Path: `/var/www/advertise-muslimadnetwork`
- Backend port: **8004**
- Frontend port: **3004**
- Database: `advertise_muslimadnetwork`

## STACK

| Layer    | Tech                    |
|----------|-------------------------|
| Backend  | Laravel 11.53.1         |
| Frontend | Next.js 16.2.6 (App Router, React 19.2.4) |
| Database | MySQL 8.0               |
| Cache    | Redis (shared)          |
| Queue    | Redis (Laravel queue)   |
| Auth     | UmmahPass SSO (admin only) + Laravel Sanctum 4.3 |
| Payments | Stripe + PayPal         |
| CRM      | Pipedrive               |
| Email    | TBD (HostGator SMTP candidate) |
| Hosting  | Nginx + PM2             |
| Node.js  | v20.20.1                |

## PM2 PROCESSES (run as root)

- `advertise-backend`  — `php artisan serve --host=0.0.0.0 --port=8004`
- `advertise-frontend` — `npm start` (port 3004)
- `advertise-queue`    — `php artisan queue:work --sleep=3 --tries=3`

## USERS

- `root` — git push, npm run build, pm2 management
- `claude-dev` — runs Claude Code only

## NGINX

- `/api/*` and `/storage/*` → Laravel :8004
- `/*` → Next.js :3004
- Config: `/etc/nginx/sites-available/advertise-muslimadnetwork`
- **Cutover note:** base44 is currently live at advertise.muslimadnetwork.com.
  DNS cutover happens in S12, not before.

## GITHUB

- Repo: `https://github.com/AshrafAnsariUMG/advertise-muslimadnetwork`
- `claude-dev` commits, root pushes

---

## DATA MODEL

### `advertisers` table — 36 fields

Carrying over the full base44 Advertiser schema with one cleanup: status enum
gets a proper state machine (see below).

**Business info:**
- `business_name` (string, required)
- `business_type` (enum: halal_food, restaurant, islamic_education,
  fashion_modest_wear, travel_hajj_umrah, finance_islamic_banking, technology,
  healthcare, real_estate, charity_nonprofit, other)
- `contact_name`, `contact_email` (required), `contact_phone`
- `website_url`, `company_description`

**Campaign:**
- `campaign_name`, `campaign_objective` (enum: brand_awareness, website_traffic,
  lead_generation, product_sales, app_installs, event_promotion,
  drive_foot_traffic, donations)
- `purchase_type` (enum: impressions, clicks)
- `campaign_offer` (required when objective = drive_foot_traffic)
- `monthly_budget` (decimal)
- `campaign_start_date`, `campaign_end_date`
- `target_countries` (json array)
- `target_location` (json: latitude, longitude, radius_miles, address)
- `target_age_range`, `target_gender` (enum: all, male, female)

**Creatives:**
- `ad_creatives` (json array of {file_url, file_name, file_size, width, height, dimension_label})
- `ad_destination_url`
- `design_service` (boolean, +$200)

**Payment:**
- `payment_method` (enum: stripe, paypal, apple_pay, google_pay)
- `payment_status` (enum: pending, paid, failed)
- `stripe_session_id`, `stripe_payment_intent`
- `paypal_order_id`, `paypal_payment_id`
- `billing_address`

**State:**
- `status` (enum, see state machine below)
- `notes`
- `recovery_email_sent`, `recovery_email_sent_date`
- `pushed_to_pipedrive`

**Standard:** `id` (uuid), `created_at`, `updated_at`, `created_by`

### Status state machine (cleaned up from base44)

```
incomplete_step_1 → incomplete_step_2 → incomplete_step_3 → pending_review
                                                              ↓
                                                       approved / rejected
                                                              ↓
                                                       active / paused
```

base44 was missing `incomplete_step_3` in its enum but the frontend referenced
it. We add it.

### Allowed ad creative dimensions (server-side validated)

- 300×250 (Medium Rectangle)
- 728×90 (Leaderboard)
- 160×600 (Wide Skyscraper)
- 320×50 (Mobile Banner)

### `users` table

Standard Laravel users + `role` enum (`admin` / `user`). Initial admin seeded
on first deploy.

### `audit_logs` table (new — base44 had no audit log)

`id, user_id, action, target_type, target_id, changes (json), ip_address, created_at`

Every admin action writes here: approve, reject, send_email, push_to_pipedrive, status_change.

---

## API ENDPOINTS

### Public (anonymous, rate-limited 10/hr per IP)

- `POST /api/v1/advertisers` — create draft
- `PUT  /api/v1/advertisers/{id}` — update (validates draft ownership via signed token on resume)
- `GET  /api/v1/advertisers/{id}` — load draft (signed URL only)
- `POST /api/v1/uploads` — file upload with dimension validation
- `POST /api/v1/checkout/stripe` — create Stripe session (server recomputes price)
- `POST /api/v1/checkout/paypal` — create PayPal order

### Webhooks (verified by signature)

- `POST /api/webhooks/stripe`
- `POST /api/webhooks/paypal`

### Admin (UmmahPass SSO + admin role required)

- `GET    /api/admin/advertisers` — list with filters
- `GET    /api/admin/advertisers/{id}`
- `PATCH  /api/admin/advertisers/{id}` — approve/reject/status updates
- `POST   /api/admin/advertisers/{id}/send-recovery-email`
- `POST   /api/admin/advertisers/{id}/push-to-pipedrive`
- `POST   /api/admin/advertisers/bulk-action` — bulk email or bulk pipedrive
- `GET    /api/admin/audit-logs`
- `GET    /api/admin/dashboard/metrics`

---

## SCOPE DECISIONS (LOCKED)

| Decision | Resolution |
|----------|------------|
| Multi-language translation | **Dropped for v1** — English only. No `TranslationContext`, no `LanguageSelector`, no `InvokeLLM`. |
| WhatsApp lead notifications | **Dropped for v1** — no `notifyWhatsApp`. May add later via Slack webhook. |
| Pipedrive integration | **In scope** — token coming from Ashraf, field/stage mapping discovered during S11. |
| Marketing pages (CTV, Halal, WhyMuslimReach, etc.) | **Keep on advertise.*** — port all 15. |
| Stripe account | **Shared with reporting dashboard** — reuse publishable key, separate secret key planned. |
| PayPal | **New** — Business account needed, longest lead time. |
| Email sender | **TBD** — Ashraf will confirm before S8. |
| `Query` entity | **Dropped** — unused in frontend. |
| `Agent*` entities (base44 AI agent) | **Dropped** — never invoked. |
| `VisualEditAgent` | **Dropped** — base44-specific. |

---

## SECURITY UPGRADES OVER BASE44

These are fixes we apply during the rebuild — base44's frontend-only model
couldn't enforce them:

1. **Server-side price calculation.** The Stripe/PayPal checkout endpoint
   recomputes `total = monthly_budget + (design_service ? 200 : 0)` from the
   stored DB record. Never trust client-supplied amounts.
2. **Server-side ad creative dimension validation.** Currently browser-only.
3. **Webhook signature verification** for both Stripe and PayPal.
4. **Rate limiting** on `/api/v1/advertisers` and `/api/v1/uploads` (10/hr/IP).
5. **Draft resume protection.** Currently `?return={id}` loads any record.
   Replace with signed URL tokens emailed to the contact_email.
6. **Idempotency** on Stripe/PayPal webhooks — duplicate deliveries do not
   double-fulfill.
7. **Audit log** on every admin action.
8. **PII cleanup** — auto-delete unpaid drafts older than 90 days (queued job).
9. **CSP, HSTS, X-Frame-Options** via Next.js headers (matches ISWP).
10. **Cloudflare WAF** in front of admin routes.

---

## SESSION PLAN (12 sessions, ~5 days)

| Session | Output |
|---------|--------|
| **S1**  | ✅ 2026-05-20 — Server scaffold — directories, Laravel 11.53.1 + Next.js 16.2.6 install, DB, `.env`, Nginx staged (not enabled), PM2 entries (IDs 54/55/56), CLAUDE.md updated |
| **S2**  | Data layer — migrations, models, AdvertiserController CRUD, FormRequest validation, upload endpoint, audit log table |
| **S3**  | Wizard shell + Step 1 (BusinessInfo) with auto-save |
| **S4**  | Wizard Step 2 (CampaignSetup, LocationPicker, BudgetRecommendation) + Step 3 shell (ReviewStep without payment) |
| **S5**  | AdCreativeStep — upload flow with server-side dimension validation |
| **S6**  | Stripe checkout + webhook + PaymentSuccess/Cancelled/ApplicationSuccess pages |
| **S7**  | PayPal checkout + webhook |
| **S8**  | Abandoned cart email job + email template (after Ashraf confirms sender) |
| **S9**  | Admin auth (UmmahPass) + AdminDashboard with Recharts metrics |
| **S10** | AdminReview + AbandonedCarts pages + audit log writes |
| **S11** | Pipedrive integration — field/stage discovery + push jobs |
| **S12** | Port 15 marketing pages, SEO meta, Nginx enable, DNS cutover, SSL, Cloudflare WAF, smoke tests |

---

## DESIGN SYSTEM (inherited from base44)

The base44 design is solid — keep as-is. Highlights:

- Color: indigo primary (`from-indigo-600 to-indigo-700`)
- Background: `bg-gradient-to-br from-slate-50 via-white to-indigo-50`
- Cards: `shadow-2xl border-0 bg-white/80 backdrop-blur-sm`
- Animation: framer-motion + canvas-confetti on conversion
- Fonts: default Tailwind stack
- Component library: shadcn/ui (Radix primitives) — already in `package.json` of reference

**Site name:** Muslim Ad Network (never "MAN" in user-facing copy)

**Footer contact:**
- Email: Sales@muslimadnetwork.com
- Phone: (886)-887-0844
- Address: 515 Madison Ave., Suite 9111, Manhattan, NY, 10022

**Pricing:**
- CPM: $5 (constant in code, see `const CPM = 5`)
- Design service: $200 flat

---

## KEY DEPENDENCIES TO INSTALL

From base44 `package.json` — keep these:

- `@hello-pangea/dnd` (drag-drop for admin)
- `@hookform/resolvers`, `react-hook-form`, `zod` (forms)
- `@radix-ui/*` (full set — shadcn/ui base)
- `@stripe/react-stripe-js`, `@stripe/stripe-js`
- `@tanstack/react-query`
- `canvas-confetti`, `framer-motion`
- `date-fns`, `moment`
- `embla-carousel-react`
- `lucide-react`
- `react-day-picker`, `react-leaflet` (location picker)
- `react-markdown`, `react-quill`
- `react-router-dom` → **replace with Next.js routing**
- `recharts` (admin dashboard)
- `sonner`, `react-hot-toast` (toasts — pick one)
- `tailwindcss-animate`, `tailwind-merge`
- `three` (background animations on marketing pages)
- `html2canvas`, `jspdf` (for downloadable summaries)

**Drop:**
- `@base44/sdk`, `@base44/vite-plugin`

---

## WORKFLOW RULES

1. Every Claude Code prompt starts with: **"Read CLAUDE.md first."**
2. Every Claude Code prompt ends with: **"Do NOT run any git commands. After
   completing, update CLAUDE.md. When done say Ready to push and stop."**
3. After Claude Code finishes (as root):
   ```
   cd /var/www/advertise-muslimadnetwork
   git add .
   git commit -m "S{N}: ..."
   git push origin main
   cd frontend && npm run build
   pm2 restart all
   ```
4. Backend-only changes:
   ```
   php artisan config:clear && php artisan config:cache
   pm2 restart advertise-backend
   ```
5. **Never hardcode `localhost:3004` or `localhost:8004`.** Always use
   `env('FRONTEND_URL')` and `env('APP_URL')`.
6. **Never run `npm run build` as root.** Always switch to `claude-dev` or use
   `sudo -u claude-dev npm run build`.
7. **Never touch PM2 processes for other projects** (iswp, ummahjobs, reporting).
8. **SQL dumps must be gitignored.** Never commit them.
9. **Reference base44 source** at `/var/www/advertise-muslimadnetwork/_base44-reference/`
   for UI/UX patterns and business logic. Never copy base44 SDK calls.

---

## ENVIRONMENT VARIABLES (placeholders)

### Backend `.env`

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://advertise.muslimadnetwork.com
FRONTEND_URL=https://advertise.muslimadnetwork.com
DB_DATABASE=advertise_muslimadnetwork
DB_USERNAME=laravel
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
CACHE_STORE=redis
SANCTUM_STATEFUL_DOMAINS=advertise.muslimadnetwork.com
CORS_ALLOWED_ORIGINS=https://advertise.muslimadnetwork.com

# Mail — to be set in S8
MAIL_MAILER=
MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_FROM_ADDRESS=

# Stripe — set in S6
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# PayPal — set in S7
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=

# Pipedrive — set in S11
PIPEDRIVE_API_TOKEN=
PIPEDRIVE_DOMAIN=
PIPEDRIVE_PIPELINE_ID=
PIPEDRIVE_STAGE_NEW_LEAD=
PIPEDRIVE_STAGE_PAID_CUSTOMER=

# UmmahPass — same pattern as reporting dashboard
UMMAHPASS_CLIENT_ID=
UMMAHPASS_REDIRECT_URI=https://advertise.muslimadnetwork.com/api/auth/ummahpass/callback
```

### Frontend `.env`

```
NEXT_PUBLIC_API_URL=https://advertise.muslimadnetwork.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## PENDING ITEMS (as of plan lock)

- [ ] Stripe secondary secret key (Ashraf will provide before S6)
- [ ] PayPal Business account + REST credentials (Ashraf to source in parallel)
- [ ] Email sender decision (Ashraf to confirm before S8)
- [ ] Pipedrive API token + domain (Ashraf to provide before S11)
- [ ] DNS cutover access for advertise.muslimadnetwork.com (HostGator) — needed at S12

---

## CUTOVER NOTES (for S12)

Current state: base44 app is **live** at advertise.muslimadnetwork.com. Cutover
sequence:

1. New site fully tested on staging URL (e.g. advertise-new.muslimadnetwork.com or
   IP-based access)
2. DNS A record updated in HostGator → 37.27.215.90
3. Wait for propagation (Cloudflare proxy makes this near-instant)
4. SSL via Certbot (or Cloudflare-issued)
5. Old base44 app: archive any in-flight unpaid drafts via CSV export, decide
   whether to email those leads about the new platform
6. Update referral matching plans (per memory: advertise.muslimadnetwork.com is
   the target for MAN brochure site referral code redemption — that integration
   is post-cutover scope)

---

## S1 COMPLETION NOTES (2026-05-20)

### Versions installed
- Laravel: **11.53.1** + laravel/sanctum 4.3
- Next.js: **16.2.6** (React 19.2.4)
- Node.js: **v20.20.1** (server-wide)
- PHP: **8.3.30** (server-wide)

### PM2 process IDs
- `advertise-backend` — PM2 ID 54
- `advertise-frontend` — PM2 ID 55
- `advertise-queue` — PM2 ID 56

### What was done
- `_base44-reference/` created, muslimadnetwork.zip extracted + deleted, OpenAPI spec moved
- `.gitignore` and `README.md` created at project root
- Laravel 11 installed in `backend/`, Sanctum installed, `.env` configured (MySQL, Redis, production settings)
- `->trustProxies(at: '*')` added to `bootstrap/app.php`
- Default Laravel migrations ran successfully (users, cache, jobs tables created)
- Next.js 16 installed in `frontend/` with App Router, JS, Tailwind — NO TypeScript
- `frontend/package.json` `start` script set to `next start -p 3004`
- `npm run build` ran as claude-dev — succeeded with 0 errors
- All 3 PM2 processes started and confirmed online

### Nginx config deviation
`claude-dev` cannot write to `/etc/nginx/sites-available/` (not in NOPASSWD sudoers for `cp`). Config file is staged at:
```
/var/www/advertise-muslimadnetwork/nginx-advertise.conf
```
**Root must run after git push:**
```bash
cp /var/www/advertise-muslimadnetwork/nginx-advertise.conf /etc/nginx/sites-available/advertise-muslimadnetwork
sudo nginx -t
# DO NOT create symlink in sites-enabled — cutover is S12
```

### Smoke test results (all passed)
- `curl http://localhost:8004` → **200**
- `curl http://localhost:3004` → **200**
- `SHOW TABLES` in `advertise_muslimadnetwork` → 9 default tables present
- `sudo nginx -t` → syntax ok
- All 3 PM2 processes: **online**
