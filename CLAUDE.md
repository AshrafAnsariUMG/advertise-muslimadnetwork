# PROJECT: advertise.muslimadnetwork.com

**Type:** Migration from base44 (self-service ad-campaign onboarding platform)
**Operator:** Ummah Media Group LLC
**Developer:** Ashraf Ansari
**Status:** S5 complete (2026-05-21) — S6 (Stripe checkout + webhook) is next

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
| **S2**  | ✅ 2026-05-20 — Data layer: 8 enums, 4 migrations (advertisers, audit_logs, users.role, personal_access_tokens), 3 models, 3 FormRequests, 3 controllers (Advertiser/Upload/Health), 4 rate-limited routes, storage:link, 6+ curl smoke tests passed |
| **S3**  | ✅ 2026-05-20 — Wizard shell + Step 1 (BusinessInfo) with 1s-debounce auto-save against PATCH /api/v1/advertisers/{id}; shadcn/ui (base-ui flavoured for Tailwind v4) initialised; URL + localStorage resume; CORS for staging IP + production domain |
| **S4**  | ✅ 2026-05-21 — Wizard Step 2 fully ported (CampaignSetupStep with CTV add-on, performance estimate, budget presets), LocationPicker (react-leaflet via dynamic ssr:false), BudgetRecommendation, Review shell with disabled payment buttons + Edit-back nav. State machine fixed: Step 2 → `incomplete_step_3`, not `pending_review` |
| **S5**  | ✅ 2026-05-21 — `has_ctv` column added (renamed from client-only `include_ctv`); react-dropzone + shadcn Switch installed; AdCreativeStep with drag-drop, client-side dim/size/mime checks, per-file XHR progress, 4-creative cap, design service Switch, Target URL field; embedded into ReviewStep; validation gate requires ≥1 creative OR design_service=true |
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
10. **Inner `.git` cleanup.** After running any tool that calls `git init` inside
    a subdirectory (e.g. `create-next-app`, `composer create-project`), delete
    the inner `.git/` before the parent repo's next commit — otherwise the
    parent treats it as a submodule and history breaks. Always run
    `find /var/www/advertise-muslimadnetwork -name .git -not -path '*/_base44-reference/*'`
    after any scaffolding command and remove any nested `.git` directories
    found below the project root.

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

---

## S2 COMPLETION NOTES (2026-05-20)

### Schema delivered
- `advertisers` — UUID PK, soft deletes, 36 columns (full base44 schema +
  `access_token`), indexes on status / payment_status / contact_email /
  created_at, unique index on access_token
- `audit_logs` — UUID PK, append-only (no `updated_at`), nullable
  `user_id` FK, indexes on action / target_type / target_id
- `users.role` — string column added, default `user`, indexed
- `personal_access_tokens` — created by `php artisan install:api` (Sanctum,
  for admin auth in S9)

### Enums (app/Enums/)
`BusinessType`, `CampaignObjective`, `PurchaseType`, `PaymentMethod`,
`PaymentStatus`, `TargetGender`, `AdvertiserStatus`, `UserRole` — all string-
backed, all expose `static values(): array` for use in validation rules and
admin filters.

### Models
- `App\Models\Advertiser` — `HasUuids`, `SoftDeletes`, full enum + JSON casts,
  `access_token` hidden by default (exposed once via `withAccessToken()` on
  create), `creating` boot hook auto-generates a 64-char access_token,
  `calculateTotal()` is the **canonical server-side price calculation**
  (monthly_budget + (design_service ? 200 : 0)) — Stripe/PayPal in S6/S7
  MUST call this, never trust client-supplied amounts.
- `App\Models\AuditLog` — `$timestamps = false`, only `created_at` (managed
  by MySQL `CURRENT_TIMESTAMP` default), `belongsTo(User::class)`.
- `App\Models\User` — added `HasApiTokens` (Sanctum), `role` cast to
  `UserRole` enum, `isAdmin(): bool` helper.

### Public API endpoints (no auth, rate-limited per IP)

| Method | Path | Throttle | Purpose |
|--------|------|----------|---------|
| GET | `/api/health` | none | Health probe — returns `{status,timestamp,version}` |
| POST | `/api/v1/advertisers` | 10/h | Create draft. **Only response that exposes `access_token`** |
| GET | `/api/v1/advertisers/{id}?token=...` | 60/h | Load draft (token-gated, never returns access_token) |
| PATCH | `/api/v1/advertisers/{id}?token=...` | 120/h | Update draft (token-gated, locked once paid) |
| POST | `/api/v1/uploads` | 30/h | Upload creative (multipart: advertiser_id + access_token + file) |

Rate limiters are registered in `app/Providers/AppServiceProvider::boot()`.

### Access-token security model — **REMEMBER THIS**

The flow is **token-on-create, token-from-client thereafter**:

1. `POST /api/v1/advertisers` creates the row and returns the full record
   INCLUDING `access_token`. This is the **only** response that ever exposes
   the token.
2. Frontend stores `access_token` in localStorage (per record).
3. Every subsequent `GET` and `PATCH` on `/api/v1/advertisers/{id}` requires
   `?token=...` matching the row's `access_token`. Mismatch → 403. Missing → 403.
   Unknown id → 404.
4. The Upload endpoint requires both `advertiser_id` and `access_token` in
   the multipart body — same token model.
5. Once `payment_status === 'paid'`, the record is locked from further public
   updates — PATCH returns **409 Conflict**. Admin endpoints (S9) will bypass
   this lock.

`hash_equals()` is used throughout — never raw `===` comparisons on tokens.

### Upload controller — security model

- **Genuine MIME via `getimagesize()`** — never trusts the upload's reported
  MIME header (browser-supplied, attacker-controllable).
- **Allowed dimensions only:** 300×250, 728×90, 160×600, 320×50. Anything else
  → 422 with a clear error listing the four allowed sizes.
- **EXIF stripped** — image is re-encoded through GD, GPS/camera metadata
  dropped. PNG transparency preserved.
- **Filename rewritten** to `{uuid}.{ext}` — never trusts the uploaded
  filename. Stored at `storage/app/public/ad-creatives/{advertiser_id}/{uuid}.{ext}`.
- **Max 4 creatives per advertiser** enforced by counting `ad_creatives` array
  on the Advertiser before accepting the upload.
- Response shape matches the base44 frontend contract:
  `{ file_url, file_name, file_size, width, height, dimension_label }`.

### Submission gate

`UpdateAdvertiserRequest::withValidator()` only enforces "required at
submission" fields when the request sets `status: pending_review`. Required
at submission: `business_name`, `business_type`, `contact_name`,
`contact_email`, `contact_phone`, `campaign_name`, `campaign_objective`,
`monthly_budget`, `campaign_start_date`, `campaign_end_date`,
`ad_destination_url`, AND at least one of `target_countries` or
`target_location`. Until that transition, every field is nullable so partial
auto-save works.

### Smoke tests run (2026-05-20)
1. `GET /api/health` → 200 `{status: ok, version: 0.1.0}` ✅
2. `POST /api/v1/advertisers` → 201, access_token in response, created_by
   auto-set to contact_email ✅
3. `PATCH /api/v1/advertisers/{id}?token={token}` → 200, fields updated ✅
4. `PATCH /api/v1/advertisers/{id}?token=wrong` → 403 ✅
5. `GET /api/v1/advertisers/{id}?token={token}` → 200, **no access_token in
   response** ✅
6. `PATCH` with `business_type=not_a_real_type` → 422 ✅
7. (bonus) `GET` without token → 403 ✅
8. (bonus) `GET` with unknown id → 404 ✅
9. (bonus) `PATCH` after payment_status manually set to paid → 409 ✅
10. (bonus) `POST /api/v1/uploads` with 300×250 PNG → 201, file stored and
    served from `/storage/ad-creatives/{id}/{uuid}.png` ✅
11. (bonus) Upload with 640×480 → 422 with clear allowed-dimensions message ✅
12. (bonus) Upload with wrong access_token → 422 (validation rejection) ✅

Test record + uploaded file cleaned from database. Orphaned file on disk
(owned by root because PM2 runs PHP as root) is harmless — no DB row
references it.

### Known follow-ups for later sessions
- **Audit log writes** are wired up at table+model level only. Admin
  controllers in S9/S10 will start writing rows.
- **`personal_access_tokens` table** is provisioned but no User can yet
  authenticate against it — S9 wires up UmmahPass SSO + admin login.
- **Orphaned creative cleanup** — when a draft is deleted (soft or hard), the
  uploaded files in `storage/app/public/ad-creatives/{id}/` are not yet
  cleaned. Schedule for the PII-cleanup job in S8.
- **Per-record file ownership.** PHP runs as root under PM2, so uploaded
  files are root-owned. Cleanup commands must run as root (artisan via PM2,
  or root cron) — claude-dev can't `rm` them directly.

---

## S3 COMPLETION NOTES (2026-05-20)

### Backend CORS

`backend/config/cors.php` created (Laravel 11 ships without it by default).
Reads comma-separated origins from `CORS_ALLOWED_ORIGINS`:
- `http://37.27.215.90:3004` (staging direct-IP access pre-cutover)
- `https://advertise.muslimadnetwork.com` (production, post-S12)

Both origins are allowed simultaneously so the DNS cutover does not require a
backend redeploy. Verified via `curl -X OPTIONS … -H "Origin: …"` — both
allowed origins receive `Access-Control-Allow-Origin` matching their request
origin; unknown origins receive no allow header.

### Frontend stack

- shadcn/ui (`shadcn` package v4) initialised — defaults: New York style,
  slate base, CSS variables. Tailwind v4 + `@base-ui/react` (the v4 successor
  to per-component Radix packages). 9 components added: `button`, `card`,
  `input`, `label`, `select`, `textarea`, `alert`, `badge`, `sonner`.
- `next-themes` is installed as a transitive dependency via the sonner
  component but is **not** wired into the app. `useTheme()` returns
  `{theme: undefined}` outside a provider; the destructuring default in
  `Toaster` falls back to `"system"`. No ThemeProvider needed for v1.
- Inter font replaces the default Geist (registered as `--font-sans`).

### Files added/changed

```
frontend/
├── components.json                                     (shadcn config)
├── next.config.mjs                                     (security headers)
├── src/
│   ├── app/
│   │   ├── globals.css                                 (shadcn tokens + tw-animate-css)
│   │   ├── layout.js                                   (title/meta, Toaster, Inter font)
│   │   └── page.js                                     (wizard shell — client)
│   ├── components/
│   │   ├── signup/
│   │   │   ├── BusinessInfoStep.jsx                    (Step 1, full port)
│   │   │   ├── CampaignSetupStep.jsx                   (Step 2 placeholder)
│   │   │   ├── ReviewStep.jsx                          (Step 3 placeholder)
│   │   │   └── StepProgress.jsx                        (stateless progress bar)
│   │   └── ui/                                         (9 shadcn components)
│   └── lib/
│       ├── api.js                                      (ApiError, getApiUrl, CRUD helpers)
│       ├── draft-storage.js                            (localStorage handle)
│       └── utils.js                                    (shadcn cn() helper)
backend/
├── config/cors.php                                     (new)
└── .env                                                (CORS_ALLOWED_ORIGINS expanded)
```

### Wizard contract

- **localStorage keys:**
  - `advertise_draft_id` — UUID of the in-progress draft
  - `advertise_draft_token` — 64-char access_token returned from create

- **URL resume params:**
  `?return={uuid}&token={access_token}` — used by the recovery email links
  the admin will send (S8). The wizard parses both, hits `getAdvertiser`, and
  if `payment_status !== 'paid'` writes the handle to localStorage and
  restores formData + currentStep based on the saved `status`.

- **Step → status mapping (auto-save):**
  - Step 0 → `incomplete_step_1`
  - Step 1 → `incomplete_step_2`
  - Step 2 → `pending_review`

- **Status → step mapping (resume):**
  - `incomplete_step_1` → 0
  - `incomplete_step_2` / `incomplete_step_3` → 1
  - `pending_review` / `approved` / `rejected` / `active` / `paused` → 2

- **Auto-save:**
  - 1-second debounce after the last `updateFormData()` call
  - Requires `contact_email` (otherwise the row would be unfindable later)
  - No advertiserId yet → `createAdvertiser` → store `{id, token}` in
    localStorage → set state
  - advertiserId exists → `updateAdvertiser(id, token, payload)`
  - On error: silent retry on next change (no toast spam — by design)
  - `saveStatus` lifecycle: `idle` → `saving` → `saved` (2s) → `idle`

- **Resume failure handling:** if `getAdvertiser` returns 403 or 404 (stale
  handle from a row that was deleted server-side, or token mismatch), the
  wizard calls `clearDraft()` and starts fresh.

### Security headers (frontend)

`next.config.mjs` `headers()` adds to every response:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

CSP is deliberately **not** added here — Stripe / PayPal iframe sources are
unknown until S6/S7, and the EPOM ad scripts (if marketing pages need them in
S12) require explicit `script-src` allowlisting. Adding CSP now would just
mean ripping it back out at every payment integration step. S12 final-polish
adds a complete CSP.

### Build + smoke results

- `npm run build` → **clean** (no errors, no warnings), 4 static pages
- `curl http://localhost:3004` → 200, SSR renders title, headline, badge,
  loading spinner
- `curl -I http://localhost:3004` → all 3 security headers present
- `NEXT_PUBLIC_API_URL=http://37.27.215.90:8004` correctly bundled into the
  page chunk (confirmed by grep on served JS chunk)
- End-to-end: `POST /api/v1/advertisers` with `Origin: http://37.27.215.90:3004`
  → 201 + `Access-Control-Allow-Origin` returned + `access_token` in body.
  Follow-up `PATCH` with that token → 200.

### Deviations from the original spec

1. **shadcn/ui internals.** The original spec assumed shadcn would install
   `@radix-ui/react-*` packages. shadcn v4 + Tailwind v4 uses `@base-ui/react`
   (Material UI's successor primitives library) instead. API surface for
   Select is identical (`value` / `onValueChange` / SelectContent / SelectItem)
   so the BusinessInfoStep port required no API changes. Documented this for
   future component additions — don't paste in Radix-specific code from
   external snippets without checking the local component first.
2. **Sonner without ThemeProvider.** The shadcn-generated `Toaster` imports
   `useTheme` from `next-themes`, but `next-themes` returns a safe default
   when there is no provider. We don't ship a ThemeProvider in v1 — light
   mode is the only theme.
3. **`Card ref={formRef}`.** React 19 + Next.js 16 + the new shadcn `Card`
   already accepts `ref` directly (no `forwardRef` needed). Verified at build
   time — no warning.
4. **`createPageUrl`, `useNavigate`.** Both base44/react-router-only — not
   ported. The wizard is a single page; no client routing needed for v1.
5. **Strict-mode double-mount.** React 19 strict mode in dev still
   double-invokes effects, but the resume effect has no side effects beyond
   the fetch — `getAdvertiser` is idempotent and `saveDraft` is set-not-
   append. No special handling required.
6. **Removed during port (will return later):** `BrandLogos`,
   `PublisherShowcase`, `CaseStudyPreview`, `RamadanCountdownBanner`,
   `TranslationProvider`, `useTranslatedContent`, `LanguageSelector`, the
   trust-signals row, and the "Powered by" footer. All scheduled for S4 (UX
   sidebar) and S12 (marketing pages + final polish).

### Known follow-ups for S4+

- **Step 2 wiring.** The placeholder receives `formData` / `updateFormData`
  with the same shape Step 1 produces — drop-in replacement when
  CampaignSetupStep, LocationPicker, BudgetRecommendation are ported.
- **Submission gate.** The backend already enforces required-at-submission
  validation when `status: pending_review` is sent. The frontend currently
  only validates Step 1; Step 2 + Step 3 validation lands in S4.
- **Recovery email URLs.** Format: `${FRONTEND_URL}/?return={id}&token={token}` —
  matches the resume parser. Will be used by the SendRecoveryEmail job in S8.
- **Toaster wired but not used.** No toasts fired yet — kept silent on
  save failures by design. S6 (payment) will be the first user of `toast.*`
  for checkout errors.

---

## S4 COMPLETION NOTES (2026-05-21)

### State machine — corrected

`STATUS_BY_STEP` in `frontend/src/app/page.js`:

| Step | Status                | Notes |
|------|-----------------------|-------|
| 0    | `incomplete_step_1`   | Step 1 entered |
| 1    | `incomplete_step_2`   | Step 2 entered |
| 2    | `incomplete_step_3`   | Step 3 (review) entered — **NOT** `pending_review` |

`pending_review` is now reserved for the explicit payment-initiation
transition that lands in S6/S7. Landing on the review screen no longer
auto-submits the record.

The `STEP_BY_STATUS` resume map already handles all the late-stage statuses
(`pending_review`, `approved`, `rejected`, `active`, `paused`) by jumping to
step 2.

### Dependencies added

```
leaflet              1.9.4
react-leaflet        5.0.0
```

`@types/leaflet` skipped — this is a JS project (no tsconfig enforcement)
and base44's runtime is JS-only.

### shadcn components added in S4

`slider`, `checkbox`, `tooltip`, `separator`. (S3 already added button, card,
input, label, select, textarea, alert, badge, sonner.)

### New components

| File                                                              | Notes |
|-------------------------------------------------------------------|-------|
| `src/components/signup/CampaignSetupStep.jsx`                     | Full Step 2 — CTV add-on, $5 CPM math, budget presets, performance estimate, country chips, age/gender selects, conditional LocationPicker when business_type=`restaurant` |
| `src/components/signup/LocationPicker.jsx`                        | react-leaflet — `MapContainer`, draggable marker, click-to-move, radius slider 1–50 mi, OSM tiles (no API key needed), "Use Current Location" via `navigator.geolocation` |
| `src/components/signup/BudgetRecommendation.jsx`                  | Industry-based nudge banner. Inline near budget slider in CampaignSetupStep. Renders nothing if current budget ≥ industry recommended |
| `src/components/signup/ReviewStep.jsx`                            | Read-only summaries for steps 0+1, ad-creative placeholder, payment summary with `monthly_budget + (design_service ? 200 : 0)`, two disabled payment buttons (Stripe / PayPal) wrapped in base-ui `Tooltip` showing "Coming in next build session" |

### LocationPicker — SSR pattern

`react-leaflet` reads `window`/`document` at module-evaluation time, so it
cannot be imported eagerly. The picker is consumed from CampaignSetupStep
via:

```jsx
const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => <div>Loading map…</div>,
});
```

LocationPicker.jsx is `'use client'` and wraps the Leaflet marker icon URL
fix in a `typeof window !== 'undefined'` guard so the module itself is
import-safe (the dynamic loader skips it on the server but this belt-and-
braces also protects future direct imports).

OpenStreetMap is the tile provider (no API key, attribution shown).

### Wizard wiring (page.js)

- `validateStep()` now enforces full Step 2 validation:
  - Required: `campaign_name`, `campaign_objective`, `monthly_budget`,
    `campaign_start_date`, `campaign_end_date`
  - At least one of `target_countries[]` or `target_location`
  - If `campaign_objective === 'drive_foot_traffic'` then
    `campaign_offer` is required
  - `campaign_end_date > campaign_start_date`
- `ReviewStep` props: `formData`, `updateFormData`, `advertiserId`,
  `accessToken`, `onEditSection(stepIndex)`, `onBack`. The Edit chips in the
  review jump back to the relevant step via `setCurrentStep(stepIndex)`.

### Known issues / follow-ups

- **`include_ctv` is client-only.** The CampaignSetupStep CTV checkbox
  toggles `formData.include_ctv` for the live UI math, but the backend
  `StoreAdvertiserRequest` / `UpdateAdvertiserRequest` don't whitelist
  `include_ctv`. Laravel's `validated()` filter strips it on save, so the
  field does NOT round-trip through resume. **If we want CTV to persist
  across refreshes,** the backend needs a `boolean include_ctv` column and
  matching validation rule. Decision deferred to whoever owns CTV product
  scope — flag for product before S6.
- **Disabled payment buttons.** The base-ui `Tooltip` wraps a non-button
  span (`render={<span/>}`) so hover events bubble even though the inner
  `<button disabled>` blocks pointer-events. Replace this stub with the real
  Stripe/PayPal flow in S6/S7.
- **No date-fns dep.** Used `Intl.DateTimeFormat` for the two date-format
  calls in ReviewStep. Saved a dependency.
- **Default values applied once.** CampaignSetupStep's defaulting effect
  intentionally runs only on mount (`[]` deps) — repeatedly applying defaults
  on every render would clobber the user's choices.

### Build + smoke

- `npm run build` — clean, zero warnings, 4 static pages
- `curl http://localhost:3004` — HTTP 200, SSR shows title, headline, loading
  spinner
- Leaflet CSS bundled into the served CSS chunk (`leaflet-container` rule
  present)
- End-to-end: `POST /api/v1/advertisers` with the new Step 2 fields →
  `incomplete_step_3` status round-trips through resume; multi-country
  targeting persists
- All security headers from S3 still present

### What's left in the wizard

- **S5** — `AdCreativeStep` with file upload to `POST /api/v1/uploads`,
  4-creative cap, drag-and-drop, allowed-dimensions UI
- **S6** — Stripe checkout + webhook, payment success / cancel pages,
  `pending_review` transition wired up
- **S7** — PayPal checkout + webhook
- **S12** — Marketing pages, BrandLogos, PublisherShowcase, CaseStudyPreview,
  RamadanCountdownBanner, footer trust signals, "Powered by" footer

---

## S5 COMPLETION NOTES (2026-05-21)

### Backend changes

- **Migration `2026_05_21_091700_add_has_ctv_to_advertisers_table`** — adds
  `has_ctv boolean default false` after `design_service`. Naming matches the
  reporting dashboard's `has_ctv` so a CTV-flagged signup here maps 1:1 to a
  CM360 record there.
- **`Advertiser` model** — `has_ctv` cast to boolean. Already fillable
  because the model uses `$guarded` (only `id`, `access_token`, timestamps,
  and `deleted_at` are guarded).
- **`StoreAdvertiserRequest` + `UpdateAdvertiserRequest`** — new rule
  `'has_ctv' => ['nullable', 'boolean']`. Now round-trips through
  `validated()`.
- Verified end-to-end: POST with `has_ctv:true` → GET returns `has_ctv:true`.

### Frontend changes

- **`CampaignSetupStep.jsx`** — all 13 references to `include_ctv` renamed
  to `has_ctv`. CTV toggle now persists across refresh.
- **`react-dropzone@latest`** installed.
- **shadcn `switch` component** added — wraps `@base-ui/react/switch`,
  `checked` + `onCheckedChange` API.

### New component: `AdCreativeStep.jsx`

Three sections, top to bottom:

1. **Upload Your Ad Creatives** — visual guide showing all 4 allowed sizes
   as scaled rectangles (drag-drop hits work as the user can see what's
   acceptable); react-dropzone area; per-file XHR upload progress; uploaded
   creative cards with thumbnail + dimension label + file size + remove
   button.
2. **Design service toggle** — Switch component, $200 add-on. Enabling it
   clears any uploaded creatives (the user is choosing to start over) and
   disables the drop zone with an explainer.
3. **Target URL** — required for the campaign to actually run. Pre-fills
   from `formData.website_url` if empty. URL format validated inline.

**Drop zone state machine:**

| State                | Behaviour |
|----------------------|-----------|
| No advertiser yet    | Disabled — "Finish Step 1 first" |
| Design service ON    | Disabled — "Design service selected" |
| At 4-creative cap    | Disabled — "Maximum 4 creatives reached" |
| Drag active          | Highlighted indigo |
| Idle                 | "Click to upload or drag and drop · N slots remaining" |

**Client-side validation** runs before each upload — size ≤ 2&nbsp;MB, MIME
in `image/jpeg|jpg|png`, dimensions match one of the 4 allowed sizes. Each
rejection surfaces a sonner toast naming the file and the reason. Server-side
validation in `UploadController` remains the authoritative gate.

**Upload mechanics** — XMLHttpRequest with `xhr.upload.onprogress` so the
percentage in the inline progress bar is real upload progress, not a spinner.
Uploads run sequentially (not in parallel) to keep the UX intelligible and
play nicely with the `uploads` rate limiter (30/h/IP).

**Remove flow** — `window.confirm` then splice from `formData.ad_creatives`.
The deleted creative's file on disk is **not** removed (PHP runs as root
under PM2, claude-dev can't `rm` it from API code; we'd need a cleanup job
that runs as root or via artisan). **TODO:** schedule a nightly artisan
command that compares files on disk under `storage/app/public/ad-creatives/`
against the `ad_creatives` arrays in `advertisers` and deletes orphans
(combine with the 90-day unpaid-draft PII cleanup from S8 scope).

### Validation gate (page.js)

`validateStep()` for `currentStep === 2`:

```
hasCreatives = Array.isArray(formData.ad_creatives) && formData.ad_creatives.length > 0
hasDesign    = formData.design_service === true
if (!hasCreatives && !hasDesign) → error "Please upload at least one ad
   creative or enable the design service"
```

This guard sits in front of the payment buttons. Payment buttons remain
disabled stubs (S6/S7) but when they activate they'll be gated by this
check.

### `ReviewStep`

Previous "Ad creative uploads come in S5" placeholder card replaced with the
live `<AdCreativeStep />`. Heading updated to "Ad Creatives & Target URL".
`updateFormData`, `advertiserId`, `accessToken` all now passed through.

### Build + smoke

- `npm run build` — clean, 4 static pages, no warnings
- `curl localhost:3004` — 200, wizard headline + badge present
- `POST /api/v1/uploads` with bogus IDs → 422 with structured `errors`
- End-to-end: POST advertiser → GD-generated 300×250 PNG → POST /uploads →
  201 with `dimension_label="300×250 (Medium Rectangle)"`, file stored at
  `storage/app/public/ad-creatives/{id}/{uuid}.png` (root-owned, served via
  `/storage/...`)

### Known follow-ups

- **Orphan file cleanup.** When the user removes a creative from
  `ad_creatives`, the underlying file stays on disk. Schedule a nightly
  artisan command in S8 to sweep up orphans (must run as root because PM2
  owns the files).
- **`payment_status === 'paid'` lock.** Editing creatives after payment is
  blocked by the existing 409 on PATCH. Good.
- **Multiple-upload UX edge.** If the user drops 5 files when 2 are already
  uploaded, dropzone's `maxFiles` would reject the lot — we override by
  trimming to `remainingSlots` and showing a sonner warning. Verified by
  inspection; needs browser-side QA from Ashraf.
- **`include_ctv` removal.** Older drafts created before 2026-05-21 have
  `has_ctv=NULL` in the DB. The boolean cast turns NULL into `false` on
  read; no migration backfill needed.
