# e-com-shop

A generic e-commerce monorepo — first vertical is an **Indian jewelry storefront** with live-metal-rate pricing, an admin panel, and a NestJS backend.

- **Storefront** — Angular 22 with SSR (SEO-first)
- **Admin** — Angular 22 CSR SPA with JWT + RBAC
- **API** — NestJS 11 + Prisma 6 + PostgreSQL 16
- **Design system** — Ivory-luxury theme, Playfair Display + Inter, Tailwind + SCSS

Full design + data model + roadmap: see [`PLAN.md`](./PLAN.md).

---

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | ≥ 22.22 or ≥ 24.15 | Angular 22 engine requirement |
| npm | ≥ 8 | Workspaces + npm scripts |
| Docker Desktop | any recent | Postgres 16 + Redis 7 for local dev |
| Git | any | You know why |

---

## Quick start

```bash
# 1. clone + install
git clone https://github.com/khushalc/ecommerce-nx-angular-nest
cd ecommerce-nx-angular-nest
npm install

# 2. env
cp .env.example .env                # dev defaults are fine

# 3. bring up Postgres + Redis
npm run db:up

# 4. run migrations + seed (creates admin user + 3 categories + 10 products)
npx prisma migrate deploy
npm run db:seed

# 5. run the three apps (each in its own terminal)
npm run dev:api          # → http://localhost:3000/api
npm run dev:storefront   # → http://localhost:4200
npm run dev:admin        # → http://localhost:4300
```

**Admin login** (seeded):

```
email:    admin@ecom-shop.dev
password: admin@12345
```

---

## Project structure

```
e-com-shop/
├── docker-compose.yml               Postgres 16 + Redis 7
├── prisma/
│   ├── schema.prisma                Full data model (Phase 1..4)
│   ├── seed.ts                      Admin + categories + products
│   └── migrations/
├── packages/
│   ├── api/                         NestJS 11 backend
│   │   └── src/
│   │       ├── auth/                JWT login + refresh
│   │       ├── categories/          /public + /admin CRUD
│   │       ├── products/            /public + /admin CRUD + pricing engine
│   │       ├── prisma/              PrismaModule + PrismaService
│   │       ├── common/              guards, decorators
│   │       └── app/                 root module, /health
│   ├── storefront/                  Angular 22 + @angular/ssr
│   │   └── src/app/
│   │       ├── layout/              master shell (announcement, ticker,
│   │       │                        header, trust badges, footer, mobile nav)
│   │       ├── pages/{home,category,product}
│   │       ├── seo/                 Title/Meta/canonical + JSON-LD
│   │       ├── data/                HttpClient services + api types
│   │       └── shared/              product-card, money pipe
│   ├── admin/                       Angular 22 CSR SPA
│   │   └── src/app/
│   │       ├── auth/                signal-based AuthService + interceptor + guards
│   │       ├── layout/              admin-shell (topbar + role-filtered sidebar)
│   │       ├── pages/{login,dashboard,products,categories}
│   │       └── data/                admin HttpClient services + api types
│   └── shared/                      TS lib (currently empty; grows in Phase 2+)
├── scripts/
│   └── verify-ui.ts                 browser-verifier (SSR + screenshots + a11y)
└── PLAN.md                          full design/data/roadmap
```

---

## npm scripts

```
   npm run …          What it does
   ─────────────────  ───────────────────────────────────────────────────
   db:up              docker compose up -d          (Postgres + Redis)
   db:down            docker compose down
   db:logs            follow Postgres logs
   db:reset           docker compose down -v && up  (wipes data)
   db:migrate         prisma migrate dev            (dev-only, creates SQL)
   db:migrate:deploy  prisma migrate deploy         (prod-safe)
   db:seed            populate 1 admin + 3 categories + 10 products
   db:studio          open Prisma Studio            (visual DB browser)

   dev:api            nx serve api                  → :3000
   dev:storefront     nx serve storefront (SSR)     → :4200
   dev:admin          nx serve admin (CSR)          → :4300

   build              nx run-many -t build          (all projects)
   lint               nx run-many -t lint
   test               nx run-many -t test

   verify:ui          Playwright + axe-core + cheerio verifier
                      (writes verify-report/ with screenshots + JSON)
```

---

## API cheat sheet

All routes are under `/api`.

```
   Public (no auth, safe to cache)
   ──────────────────────────────────────────────────────────────
   GET  /api/health
   GET  /api/public/categories
   GET  /api/public/categories/:slug            (with products)
   GET  /api/public/products?category=...&fresh=true&take=&skip=
   GET  /api/public/products/:slug

   Auth
   ──────────────────────────────────────────────────────────────
   POST /api/auth/login       { email, password } → { accessToken, refreshToken, user }
   POST /api/auth/refresh     { refreshToken }
   GET  /api/auth/me          (Bearer token)

   Admin (Bearer token + role guard)
   ──────────────────────────────────────────────────────────────
   GET    /api/admin/categories
   POST   /api/admin/categories
   PATCH  /api/admin/categories/:id
   DELETE /api/admin/categories/:id             (soft-delete)

   GET    /api/admin/products?search=&categoryId=&take=&skip=
   POST   /api/admin/products
   PATCH  /api/admin/products/:id
   DELETE /api/admin/products/:id               (soft-delete)
   POST   /api/admin/products/upload-url        (S3 pre-signed URL — stubbed)
```

### Try it

```bash
# get seeded categories
curl http://localhost:3000/api/public/categories

# get a product with computed price
curl http://localhost:3000/api/public/products/classic-band-22k

# login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecom-shop.dev","password":"admin@12345"}'

# list products with the returned token
TOKEN=<paste-accessToken>
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/admin/products
```

---

## Browser verifier

Run after any frontend change to catch regressions:

```bash
npm run verify:ui
```

Requires the storefront to be running on `:4200`.

- Renders `/`, `/c/gold-rings`, `/p/classic-band-22k` in Chromium at three viewports (375 / 768 / 1440).
- Screenshots → `verify-report/screenshots/*.png`
- Asserts SSR `<title>`, meta description, canonical URL, JSON-LD Product schema.
- Captures console errors + pageerrors per viewport.
- Runs axe-core a11y scan on the desktop viewport.
- Writes a machine-readable `verify-report/report.json`.

Non-zero exit if SSR checks fail or any console errors occurred.

*Lighthouse is scaffolded but currently disabled — its SWC-compiled internals throw `__name is not defined` when loaded via `tsx`. Fixing it needs a pre-compile step and is a Phase-4 hook-up.*

---

## Common tasks

### Add a new admin user

Bcrypt-hash a password and insert with `psql` or a one-off script. Or grant your existing admin the `SUPER_ADMIN` role and use `/api/admin/*` endpoints once you build the users CRUD.

### Reset local data

```bash
npm run db:reset            # wipes volumes
npx prisma migrate deploy
npm run db:seed
```

### Regenerate the Prisma client after schema edits

```bash
npx prisma migrate dev --name what_you_changed
```

This creates a new SQL migration file, applies it, and regenerates the client.

### Change the theme

- Storefront tokens: `packages/storefront/tailwind.config.js` + `packages/storefront/src/styles.scss`
- Admin tokens: `packages/admin/tailwind.config.js` + `packages/admin/src/styles.scss`

Both share the same spacing scale and font families; storefront adds a gold palette, admin uses a cool neutral.

### Add a new page (storefront)

1. Create `packages/storefront/src/app/pages/foo/foo.component.ts`
2. Add a route in `packages/storefront/src/app/app.routes.ts`
3. For dynamic segments, also add a `RenderMode.Server` entry in `app.routes.server.ts` (else prerender will fail).
4. Call `SeoService.applyBasic({ title, description, canonicalPath })` in `ngOnInit`.

---

## Troubleshooting

**Docker containers not starting**
```bash
docker compose down -v && docker compose up -d
docker compose ps        # both should show "healthy"
```

**Prisma "url is no longer supported"**
You're on Prisma 7. Downgrade: `npm install --save-dev prisma@^6 && npm install @prisma/client@^6`.

**Angular "TypeScript project references" error on new generator**
The workspace's tsconfigs are stripped of `composite` / `references`. If Nx re-adds them, remove them again from `tsconfig.base.json` and `tsconfig.json`.

**Admin port conflict**
Admin runs on `:4300` (set in `packages/admin/project.json → serve.options.port`). Change there if needed.

**Node engine warning**
Angular 22 wants Node `≥ 22.22` or `≥ 24.15`. Older versions still work but warnings are noisy. Upgrade with `nvm install 24 && nvm use 24`.

**Storefront hydration mismatch warnings**
Check that any component that reads `Date.now()` / `Math.random()` on init uses `isPlatformBrowser` — those produce different values in SSR vs CSR.

---

## Roadmap

Phase 1 (current) is the skeleton: workspace + auth + catalog CRUD + storefront pages + admin.

```
   Phase 2   Sales campaigns · coupons · per-product discount · Fresh flag
             live gold-rate feed (replaces static pricing fallback)
   Phase 3   Customer OTP auth · cart · checkout
             Razorpay + PayU + COD · order lifecycle + emails/SMS
             idempotency · atomic stock deduction with ledger
   Phase 4   Reviews · wishlist · real S3 uploads · reports · GST invoices
             Lighthouse in verifier · a11y polish pass
```

Full details, entity relationships, and the money-safety invariants live in [`PLAN.md`](./PLAN.md).

---

## License

Currently un-licensed (all rights reserved). Add a `LICENSE` file before treating this as OSS.
