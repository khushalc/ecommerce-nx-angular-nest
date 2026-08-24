# e-com-shop — Plan

Generic e-commerce workspace, first vertical: **Indian jewelry storefront** (SSR, SEO-first) + **admin panel** (CSR SPA) + **NestJS API**, all inside one Nx monorepo.

Status: **planning — no code generated yet.** Waiting on: (1) user installing Docker Desktop, (2) user go-ahead.

---

## 1. Locked decisions

| Area | Decision |
|---|---|
| Repo layout | Nx monorepo |
| App split | Two separate Angular apps (storefront + admin) |
| Database | PostgreSQL 16 + Prisma |
| Region / market | India (INR, GST, Razorpay + PayU + COD) |
| Pricing model | Hybrid — per-category `pricingMode`: `LIVE_METAL_RATE` or `FIXED_MRP` |
| Sales model | Time-bound campaigns + per-product discount + coupon codes + "Fresh" flag |
| Customer auth | Phone OTP (MSG91) + optional email |
| Admin auth | Email + password + RBAC (roles: `SUPER_ADMIN`, `CATALOG_MANAGER`, `ORDER_MANAGER`) |
| Media storage | AWS S3 + CloudFront (pre-signed uploads) |
| MVP commerce | Stock tracking, order emails/SMS + manual tracking#, reviews with moderation, wishlist |
| Local infra | docker-compose (Postgres 16 + Redis 7) — user installing Docker Desktop |
| Versions | Angular 19, NestJS 10, Node 20 LTS (dev env is Node 24.4.1 — fine) |
| First slice | Skeleton + admin login/product-CRUD + storefront home/category/PDP |
| Visual theme | **Ivory / warm luxury** — bg `#FAF6EF`, ink `#1F1B16`, gold `#B8860B` |
| Typography | Serif display (Playfair Display) + sans body (Inter) |
| Styling | Tailwind + hand-built components + Angular CDK |
| Header extras | Live gold-rate ticker + dismissible announcement bar + trust badges strip |

---

## 2. System architecture

```
                        ┌──────────────────────────────────────┐
                        │            Public users              │
                        │       (Google bot, shoppers)         │
                        └───────────────┬──────────────────────┘
                                        │  HTTPS
                                        ▼
   ┌────────────────────────────┐               ┌────────────────────────────┐
   │  apps/storefront (Angular) │               │   apps/admin (Angular)     │
   │  ─ SSR via @angular/ssr    │               │   ─ CSR only (SPA)         │
   │  ─ shop.example.com        │               │   ─ admin.example.com      │
   │  ─ SEO tags + JSON-LD      │               │   ─ JWT + role guards      │
   │  ─ Node server renders     │               │   ─ Nginx static hosting   │
   └──────────────┬─────────────┘               └──────────────┬─────────────┘
                  │ REST (JSON)                                │ REST (JSON)
                  ▼                                            ▼
                        ┌──────────────────────────────────────┐
                        │        apps/api (NestJS 10)          │
                        │  ─ /public/*   (no auth, cached)     │
                        │  ─ /admin/*    (JWT + RBAC guard)    │
                        │  ─ /auth/*     (login, refresh, OTP) │
                        └───────┬────────────────────┬─────────┘
                                │                    │
                                ▼                    ▼
              ┌──────────────────────┐   ┌──────────────────────┐
              │ Postgres 16 (Prisma) │   │  Redis 7             │
              │ orders, products, ...│   │  cache, BullMQ jobs  │
              └──────────────────────┘   └──────────────────────┘
                                │
                                ▼
              ┌──────────────────────┐
              │  S3 + CloudFront     │  ← images uploaded via
              │  (Phase 1: stub)     │    pre-signed URLs
              └──────────────────────┘
```

---

## 3. Nx workspace tree

```
Learning/
└── e-com-shop/                           ← Nx workspace root
    ├── nx.json
    ├── package.json
    ├── tsconfig.base.json
    ├── docker-compose.yml                ← Postgres 16 + Redis 7
    ├── .env.example
    ├── .gitignore
    ├── PLAN.md                           ← this file
    │
    ├── apps/
    │   ├── storefront/                   ← Angular 19 + SSR
    │   │   └── src/app/
    │   │       ├── layout/               shell.component + subcomponents
    │   │       ├── pages/{home,category,product}
    │   │       ├── seo/                  Title/Meta service, JSON-LD helper
    │   │       ├── data/                 HttpClient services
    │   │       └── theme/                design tokens (CSS vars + Tailwind config)
    │   │
    │   ├── admin/                        ← Angular 19 CSR SPA
    │   │   └── src/app/
    │   │       ├── layout/               admin-shell + sidebar + topbar
    │   │       ├── pages/{login,dashboard,products,orders}
    │   │       ├── auth/                 JWT interceptor + RolesGuard
    │   │       └── shared/               forms, tables, dialogs
    │   │
    │   └── api/                          ← NestJS 10
    │       └── src/
    │           ├── prisma/               PrismaModule + PrismaService
    │           ├── auth/                 login, JWT strategy, refresh, OTP (later)
    │           ├── admin-users/          RBAC roles + hashing
    │           ├── categories/           /public + /admin controllers
    │           ├── products/             CRUD + S3 pre-signed URL endpoint
    │           ├── orders/               (Phase 3)
    │           ├── payments/             (Phase 3)
    │           ├── notifications/        (Phase 3, email/SMS)
    │           └── common/               guards, decorators, filters
    │
    ├── libs/
    │   └── shared/                       ← consumed by all 3 apps
    │       └── src/
    │           ├── dto/                  CategoryDto, ProductDto, OrderDto, …
    │           ├── enums/                PricingMode, AdminRole, OrderStatus, …
    │           └── index.ts
    │
    └── prisma/
        ├── schema.prisma
        ├── migrations/
        └── seed.ts                       3 categories + 10 products (Phase 1)
```

---

## 4. Design system

### 4.1 Color tokens (CSS variables + Tailwind theme extension)

```
─────────────────────────────────────────────────────────────
  Token            Hex        Use
─────────────────────────────────────────────────────────────
  --bg             #FAF6EF    Page background (ivory)
  --bg-elevated    #FFFFFF    Cards, modals, table rows
  --bg-muted       #F1EADD    Section bands, hover states
  --ink            #1F1B16    Primary text (near-black warm)
  --ink-muted      #6B6355    Secondary text, meta
  --ink-subtle     #A69C88    Placeholders, dividers
  --gold           #B8860B    Primary accent / CTA
  --gold-hover     #9E7409    CTA hover
  --gold-soft      #D4AF37    Highlights, price color
  --line           #E7DFCE    Borders, hairlines
  --success        #2E7D32    In-stock, delivered
  --warning        #B4820D    Low stock, pending
  --danger         #B71C1C    Out of stock, failed, cancel
  --info           #0F5FA3    Links, informational badges
─────────────────────────────────────────────────────────────
```

### 4.2 Typography scale

```
  Serif display   Playfair Display     — h1, h2, hero, product name on PDP
  Sans body       Inter                — everything else
  Mono            JetBrains Mono       — SKUs, order IDs (admin)

  ─────────────────────────────────────────────────────
   Style      Size / Line-height   Weight    Font
  ─────────────────────────────────────────────────────
   display    56 / 64              600       Playfair
   h1         40 / 48              600       Playfair
   h2         32 / 40              600       Playfair
   h3         24 / 32              600       Playfair
   h4         20 / 28              500       Inter
   body-lg    18 / 28              400       Inter
   body       16 / 24              400       Inter
   body-sm    14 / 20              400       Inter
   caption    12 / 16              500       Inter (uppercase, tracking-wide)
   price      20 / 24              600       Inter (tabular-nums)
  ─────────────────────────────────────────────────────
```

### 4.3 Spacing scale (Tailwind default is fine; alias these)

```
  xs=4  sm=8  md=16  lg=24  xl=32  2xl=48  3xl=64  4xl=96
```

### 4.4 Breakpoints

```
  sm  ≥ 640px    (large phone)
  md  ≥ 768px    (tablet)
  lg  ≥ 1024px   (small laptop)
  xl  ≥ 1280px   (desktop)
  2xl ≥ 1536px   (wide desktop)

  Container max-width: 1280px, gutter 24px (mobile) → 48px (desktop).
```

### 4.5 Component contracts (Phase 1 primitives)

```
  <ui-button variant="primary|ghost|outline" size="sm|md|lg" loading>
  <ui-card padding elevated>
  <ui-badge tone="gold|success|warning|danger|neutral">
  <ui-input label error hint />                 (reactive-forms compatible)
  <ui-select ...>
  <ui-money value=... />                        (₹82,400 formatting, tabular)
  <ui-image src srcset lazy alt />              (S3-CDN-aware, 3:4 default aspect)
  <ui-breadcrumbs items />
  <ui-empty-state title body cta />
```

---

## 5. Master layout — storefront

Two shell components:
- `AppShellComponent` — outer skeleton (announcement bar, gold-rate ticker, header, footer)
- `PageContainerComponent` — inner content wrapper (max-width, gutters, breadcrumb slot)

### 5.1 Desktop wireframe (≥ lg)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  ✕  Diwali Sale live — up to 20% off making charges. Shop now →              │  ← announcement bar (dismissible)
├───────────────────────────────────────────────────────────────────────────────┤
│  Gold 22K  ₹6,845 /g   ▲    Gold 24K  ₹7,465 /g   ▲    Silver  ₹94 /g  ▼      │  ← live gold-rate ticker
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  LOGO           Rings   Necklaces   Earrings   Bangles   Collections   Sale   │  ← header (logo left, nav center)
│                                                            🔍   👤   ♥   🛒 3 │       search / account / wishlist / cart
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                             <router-outlet />                                 │
│                                                                               │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│  🛡  BIS Hallmark    📜  IGI Certified    🚚  Free Insured Shipping    ⇄  15-day Exchange │  ← trust badges strip
├───────────────────────────────────────────────────────────────────────────────┤
│  Shop            Collections       Customer Care       Company                │
│   Rings           New Arrivals      Contact us          About                 │  ← footer (4 columns)
│   Necklaces       Bestsellers       Shipping            Journal               │
│   Earrings        Bridal            Returns             Careers               │
│   Bangles         Everyday          Care Guide          Press                 │
│                                                                               │
│   ─────────────────────────────────────────────────────────────────────────   │
│   © 2026 e-com-shop · GST 27ABCDE1234F1Z5 · Privacy · Terms      ⓘ  🔗 🔗 🔗   │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Mobile wireframe (< md)

```
┌─────────────────────────────────┐
│ ✕ Diwali Sale — 20% off →       │  announcement (thinner)
├─────────────────────────────────┤
│ 22K ₹6,845 · 24K ₹7,465 · Ag ₹94│  ticker (horizontal scroll)
├─────────────────────────────────┤
│  ☰    LOGO         🔍   ♥   🛒  │  header (drawer menu)
├─────────────────────────────────┤
│                                 │
│       <router-outlet />         │
│                                 │
├─────────────────────────────────┤
│  🛡  📜  🚚  ⇄  (horizontal)    │  trust badges (icons only)
├─────────────────────────────────┤
│  ▸ Shop                         │  footer (accordion)
│  ▸ Collections                  │
│  ▸ Customer Care                │
│  ▸ Company                      │
│  © 2026 e-com-shop              │
└─────────────────────────────────┘
   [ Home ] [ Cats ] [ ♥ ] [ 🛒 ] [ 👤 ]   ← bottom nav (sticky, mobile only)
```

### 5.3 Storefront shell component contract

```typescript
// apps/storefront/src/app/layout/shell.component.ts
@Component({
  selector: 'sf-shell',
  standalone: true,
  imports: [RouterOutlet, AnnouncementBarComponent, GoldRateTickerComponent,
            HeaderComponent, TrustBadgesComponent, FooterComponent,
            MobileBottomNavComponent],
  template: `
    <sf-announcement-bar *ngIf="announcement$ | async as a" [message]="a" />
    <sf-gold-rate-ticker [rates]="rates$ | async" />
    <sf-header [cartCount]="cartCount$ | async" [user]="user$ | async" />
    <main class="min-h-[60vh]">
      <router-outlet />
    </main>
    <sf-trust-badges />
    <sf-footer />
    <sf-mobile-bottom-nav class="lg:hidden" />
  `,
})
export class ShellComponent { /* data injected from services */ }
```

Master route wiring:

```typescript
export const APP_ROUTES: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '',          loadComponent: () => import('./pages/home/...') },
      { path: 'c/:slug',   loadComponent: () => import('./pages/category/...') },
      { path: 'p/:slug',   loadComponent: () => import('./pages/product/...') },
      { path: 'account',   loadChildren: () => import('./pages/account/routes') },   // Phase 3+
      { path: 'cart',      loadComponent: () => import('./pages/cart/...') },        // Phase 3
      { path: 'checkout',  loadComponent: () => import('./pages/checkout/...') },    // Phase 3
    ],
  },
];
```

---

## 6. Master layout — admin

Separate app, separate shell. No SSR. Auth-gated at the router level; unauthenticated users see only `/login`.

### 6.1 Desktop wireframe

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  LOGO (e-com-shop admin)                    Search…            🔔 3    👤 ▾   │  ← topbar
├──────────────┬────────────────────────────────────────────────────────────────┤
│              │                                                                │
│  Dashboard   │                                                                │
│              │                                                                │
│  Catalog  ▾  │                                                                │
│   Categories │                                                                │
│   Products   │                    <router-outlet />                           │
│   Sales      │                                                                │
│   Coupons    │                                                                │
│              │                                                                │
│  Orders   ▾  │                                                                │
│   All        │                                                                │
│   Pending    │                                                                │
│   Shipped    │                                                                │
│   Returns    │                                                                │
│              │                                                                │
│  Customers   │                                                                │
│  Reviews     │                                                                │
│  Reports     │                                                                │
│              │                                                                │
│  ⚙  Settings │                                                                │
│              │                                                                │
└──────────────┴────────────────────────────────────────────────────────────────┘
    240 px                                          fluid
```

### 6.2 Admin shell component contract

```typescript
// apps/admin/src/app/layout/admin-shell.component.ts
@Component({
  selector: 'admin-shell',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, AdminTopbarComponent],
  template: `
    <admin-topbar [user]="user()" (logout)="onLogout()" />
    <div class="flex">
      <admin-sidebar [nav]="nav()" [role]="user()?.role" />
      <main class="flex-1 p-lg overflow-x-auto"><router-outlet /></main>
    </div>
  `,
})
export class AdminShellComponent { /* nav is filtered by role */ }
```

Nav items are declared once with role gates:

```typescript
const NAV: NavItem[] = [
  { label: 'Dashboard',  path: '/',           roles: ALL },
  { label: 'Categories', path: '/categories', roles: [SUPER_ADMIN, CATALOG_MANAGER] },
  { label: 'Products',   path: '/products',   roles: [SUPER_ADMIN, CATALOG_MANAGER] },
  { label: 'Orders',     path: '/orders',     roles: [SUPER_ADMIN, ORDER_MANAGER] },
  { label: 'Settings',   path: '/settings',   roles: [SUPER_ADMIN] },
  // …
];
```

---

## 7. Data model

Full model documented up front so migrations don't have to be rewritten. Phase 1 builds full CRUD only for the **bold** entities; the rest are schema-only stubs.

### 7.1 Entities

| Entity | Purpose | Phase |
|---|---|---|
| **AdminUser** | Admin login + RBAC | 1 |
| **Category** | Taxonomy tree (parent + sub-cats, 2 levels), `pricingMode`, hero image | 1 |
| **Product** | SKU, images, stock, pricing fields (both modes), `isFresh`, `specialDiscount` | 1 |
| Customer | Storefront account (phone-first) | 2 |
| Address | Customer shipping addresses | 2/3 |
| MetalRateDaily | Daily gold/silver rate rows; latest used in ticker + LIVE pricing | 2 |
| Sale | Time-bound campaign: banner content + optional per-product discounts | 1.5 |
| SaleTarget | Links a `Sale` to a `Product` with optional per-product `discountPctOverride` | 1.5 |
| Coupon | Codes with rules (min cart, category, cap) | 2 |
| Cart / CartItem | Persistent cart per customer + guest sessionId | 3 |
| Order / OrderItem | Placed orders + line snapshots | 3 |
| Payment | Razorpay/PayU/COD attempts + webhooks | 3 |
| Shipment | Tracking#, courier, status, delivery date | 3 |
| OrderStatusEvent | Immutable audit log of status transitions | 3 |
| Notification | Email/SMS dispatch log | 3 |
| Review | Verified-buyer, moderation state | 4 |
| WishlistItem | Customer ↔ product | 4 |

### 7.2 Key Prisma sketches

```prisma
enum PricingMode      { LIVE_METAL_RATE  FIXED_MRP }
enum Metal            { GOLD  SILVER  PLATINUM }
enum Purity           { K14  K18  K22  K24 }
enum AdminRole        { SUPER_ADMIN  CATALOG_MANAGER  ORDER_MANAGER }
enum OrderStatus      { PLACED  CONFIRMED  PACKED  SHIPPED
                        OUT_FOR_DELIVERY  DELIVERED  CANCELLED
                        RETURN_REQUESTED  RETURNED  REFUNDED }
enum PaymentStatus    { INITIATED  AUTHORIZED  CAPTURED  FAILED  REFUNDED }
enum PaymentMethod    { RAZORPAY  PAYU  COD }

model Category {
  id            String       @id @default(uuid())
  slug          String       @unique
  name          String
  description   String?
  pricingMode   PricingMode                     // inherited from parent when parentId is set
  heroImageUrl  String?
  sortOrder     Int          @default(0)
  isActive      Boolean      @default(true)

  // Hierarchy (2-level cap enforced at the service layer)
  parent        Category?    @relation("CategoryTree", fields: [parentId], references: [id])
  parentId      String?
  children      Category[]   @relation("CategoryTree")

  products      Product[]                       // only populated for leaf categories
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([parentId, sortOrder])
}

model Product {
  id              String     @id @default(uuid())
  slug            String     @unique
  name            String
  description     String?
  category        Category   @relation(fields: [categoryId], references: [id])
  categoryId      String
  sku             String     @unique
  images          String[]
  stock           Int        @default(0)
  isActive        Boolean    @default(true)
  isFresh         Boolean    @default(false)
  specialDiscount Decimal?   @db.Decimal(5,2)   // % off, product-scoped

  // FIXED_MRP
  mrp             Decimal?   @db.Decimal(12,2)

  // LIVE_METAL_RATE
  metal           Metal?
  purity          Purity?
  weightGrams     Decimal?   @db.Decimal(8,3)
  makingPct       Decimal?   @db.Decimal(5,2)
  stoneValue      Decimal?   @db.Decimal(12,2)

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}
```

(Order/Payment/Shipment prisma sketches in §8.)

### 7.2b Sale (event) rules — enhanced from initial Phase-2 sketch

A `Sale` is a **time-bound admin-controlled event**. Two orthogonal things a sale does:

1. **Banner** — appears in the storefront's announcement strip while the sale is active. Content: `bannerLabel`, optional `bannerImageUrl`, optional CTA (`ctaLabel` + `ctaHref`).
2. **Pricing** — each product linked via `SaleTarget` gets a discount for the duration of the sale. Rules:
   - `Sale.defaultDiscountPct` sets a fallback rate for every linked product.
   - Each `SaleTarget.discountPctOverride` (nullable) beats the default for that specific product. So Product A can be 80% off while Product B is 50% off in the same sale.
   - `Sale.maxDiscountPerCart` caps how much of the discount can be applied to a single cart (in ₹). Stored now, **enforced at checkout in Phase 3**.
   - Product-scoped `Product.specialDiscount` and sale-scoped `SaleTarget` discounts don't stack — the **larger** of the two wins per product.

**Banner selection**: if multiple sales are active in the same window, the one with the **most recent `createdAt`** takes the announcement bar. Simple, no priority field.

**Bulk operations on products** — general-purpose, live on `/admin/products` (independent of sales):
   - Bulk set / clear special discount %
   - Bulk mark / unmark fresh
   - Bulk activate / deactivate
   - Bulk change category (must remain in a leaf per §7.3)

The **sale editor** on `/admin/sales/:id` reuses the same product filter picker to assign products to a sale + specify per-product `discountPctOverride` inline.

```prisma
model Sale {
  id                 String     @id @default(uuid())
  name               String
  slug               String     @unique
  description        String?
  startsAt           DateTime
  endsAt             DateTime
  isActive           Boolean    @default(true)

  // Banner
  bannerImageUrl     String?
  bannerLabel        String?    // "Diwali Sale — up to 20% off"
  ctaLabel           String?    // "Shop now"
  ctaHref            String?    // "/c/gold-rings"
  showInBanner       Boolean    @default(true)

  // Pricing
  defaultDiscountPct Decimal?   @db.Decimal(5,2)
  maxDiscountPerCart Decimal?   @db.Decimal(12,2)

  targets            SaleTarget[]
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@index([isActive, startsAt, endsAt])
}

model SaleTarget {
  sale                Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  saleId              String
  product             Product  @relation(fields: [productId], references: [id])
  productId           String
  discountPctOverride Decimal? @db.Decimal(5,2)   // null → use Sale.defaultDiscountPct

  @@id([saleId, productId])
  @@index([productId])
}
```

### 7.3 Category hierarchy rules

Categories form a **2-level tree**: root categories (no parent) → sub-categories (parent set to a root). Deeper nesting is blocked at the service layer even though the self-relation is technically unlimited.

```
   Gold Jewelry         (root, pricingMode = LIVE_METAL_RATE)
   ├── Wedding Rings    (sub, inherits LIVE_METAL_RATE)     ← products live here
   ├── Casual Rings     (sub, inherits LIVE_METAL_RATE)     ← products live here
   └── Necklaces        (sub, inherits LIVE_METAL_RATE)     ← products live here

   Diamond Jewelry      (root, pricingMode = FIXED_MRP)
   ├── Solitaires       (sub, inherits FIXED_MRP)           ← products live here
   └── Bracelets        (sub, inherits FIXED_MRP)           ← products live here

   Silver               (root, pricingMode = LIVE_METAL_RATE)     ← products live here
                                                            (leaf root; no sub-cats yet)
```

**Rules enforced in `CategoriesService`:**

- `parentId` must reference a category whose own `parentId` is `null` (2-level cap).
- When `parentId` is set, `pricingMode` is copied from the parent on create and locked on update (the admin form hides the field for sub-categories).
- A category cannot be deleted (soft-deactivated only) if it has active children — deactivate children first.
- Slugs remain **globally unique** across the whole tree, so URLs stay flat: `/c/wedding-rings` works from anywhere.

**Rules enforced in `ProductsService`:**

- A product's `categoryId` must reference a **leaf** category (`children.length === 0`). If a category grows children later, existing products stay put but new ones can no longer be created there.
- Listing a root category's `/api/public/products?category=<root-slug>` returns the **aggregated** products across all its leaf children (Phase 2 improvement; Phase 1 returns empty for roots-with-children).

**Storefront rendering** (per §5 / §11):

- Home category grid shows **root categories only** (`WHERE parentId IS NULL`).
- Category page for a root with children shows a **sub-category chip row** at the top and no direct products; each chip navigates to the sub-category page.
- Category page for a leaf shows the product grid as usual.

**Admin surfaces** (per §6):

- Categories list renders as a **tree** — root rows with their children indented one level.
- Category form has a `parent` dropdown showing only roots (categories with `parentId === null`); leaves the field empty to create a new root.
- Product form's category dropdown filters to **leaf categories only** and groups them under their parent for scanability.

---

## 8. Orders, tracking & status

Full end-to-end order handling. Design captured now; **build target = Phase 3** (after auth, cart, checkout, payment are in place). Phase 1 ships the `Order/OrderItem/Payment/Shipment/OrderStatusEvent` **schema stubs** so we don't rewrite migrations later.

### 8.1 Order status state machine

```
                       ┌──────────┐
                       │  PLACED  │  ← checkout success (all methods)
                       └────┬─────┘
                            │ payment captured  (or COD accepted)
                            ▼
                       ┌───────────┐
                       │ CONFIRMED │  ← admin/auto confirm
                       └────┬──────┘
                            │ admin picks & packs
                            ▼
                       ┌──────────┐
                       │  PACKED  │
                       └────┬─────┘
                            │ admin enters tracking# + courier
                            ▼
                       ┌──────────┐
                       │ SHIPPED  │────► notification: email + SMS
                       └────┬─────┘
                            │ (last-mile update, manual or webhook)
                            ▼
                     ┌─────────────────┐
                     │ OUT_FOR_DELIVERY│
                     └────────┬────────┘
                              │
                              ▼
                       ┌───────────┐
                       │ DELIVERED │────► review request email (T+3 days)
                       └────┬──────┘
                            │ (customer initiates within 15-day window)
                            ▼
                    ┌──────────────────┐
                    │ RETURN_REQUESTED │
                    └────────┬─────────┘
                             │ admin approves + reverse pickup
                             ▼
                       ┌──────────┐          ┌──────────┐
                       │ RETURNED │─────────►│ REFUNDED │
                       └──────────┘          └──────────┘

  Side branches from PLACED / CONFIRMED / PACKED:
       ─► CANCELLED (customer- or admin-initiated; auto-refund if paid)
```

Rules:
- Transitions are one-way except **RETURN_REQUESTED → PACKED** (rejected return) is allowed.
- Every transition writes an immutable `OrderStatusEvent` row (`from`, `to`, `actorType`, `actorId`, `note`, `createdAt`) — this is what powers the tracking timeline.
- COD orders skip payment gateway but still write a `Payment` row with `method = COD, status = INITIATED` until the courier confirms collection (later phase).

### 8.2 Prisma sketch

```prisma
model Order {
  id             String     @id @default(uuid())
  orderNumber    String     @unique                // human-readable e.g. ES-2026-000123
  customer       Customer   @relation(fields: [customerId], references: [id])
  customerId     String
  status         OrderStatus @default(PLACED)
  subtotal       Decimal    @db.Decimal(12,2)
  discountTotal  Decimal    @db.Decimal(12,2)     // sale + coupon + product discount
  gstTotal       Decimal    @db.Decimal(12,2)
  shippingTotal  Decimal    @db.Decimal(12,2)
  grandTotal     Decimal    @db.Decimal(12,2)
  shippingAddress Json                            // snapshot at order time
  billingAddress  Json?
  items          OrderItem[]
  payments       Payment[]
  shipment       Shipment?
  events         OrderStatusEvent[]
  notes          String?                          // internal admin notes
  placedAt       DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@index([customerId, placedAt])
  @@index([status, placedAt])
}

model OrderItem {
  id            String   @id @default(uuid())
  order         Order    @relation(fields: [orderId], references: [id])
  orderId       String
  productId     String
  sku           String
  nameSnapshot  String
  imageSnapshot String
  qty           Int
  unitPrice     Decimal  @db.Decimal(12,2)        // snapshot after discount
  lineTotal     Decimal  @db.Decimal(12,2)
  // pricing breakdown snapshot (metal rate used, making%, etc.) as Json
  pricingBreakdown Json?
}

model Payment {
  id            String        @id @default(uuid())
  order         Order         @relation(fields: [orderId], references: [id])
  orderId       String
  method        PaymentMethod
  status        PaymentStatus
  amount        Decimal       @db.Decimal(12,2)
  gatewayOrderId String?
  gatewayPaymentId String?
  rawPayload    Json?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model Shipment {
  id            String   @id @default(uuid())
  order         Order    @relation(fields: [orderId], references: [id])
  orderId       String   @unique
  courier       String                             // "Delhivery", "Bluedart", …
  trackingNumber String
  trackingUrl   String?
  shippedAt     DateTime?
  deliveredAt   DateTime?
}

model OrderStatusEvent {
  id         String      @id @default(uuid())
  order      Order       @relation(fields: [orderId], references: [id])
  orderId    String
  from       OrderStatus?
  to         OrderStatus
  actorType  String                              // "SYSTEM" | "ADMIN" | "CUSTOMER" | "WEBHOOK"
  actorId    String?
  note       String?
  createdAt  DateTime    @default(now())

  @@index([orderId, createdAt])
}
```

### 8.3 Customer-facing tracking

Three surfaces:

1. **Order confirmation page** (`/checkout/success/:orderNumber`) — shows summary + timeline (only PLACED lit up).
2. **My orders** (`/account/orders`) — paginated list with status chips + reorder button.
3. **Order detail** (`/account/orders/:orderNumber`) — items, addresses, payments, full status timeline, courier tracking link, download invoice, initiate return button (only when `DELIVERED` and within 15 days), cancel button (only when status ∈ {PLACED, CONFIRMED}).
4. **Public track order** (`/track?orderNumber=...&otp=...`) — for guest checkouts; OTP sent on the phone tied to the order.

Timeline component (ASCII preview):

```
  ●━━━━━━━━━━●━━━━━━━━━━●━━━━━━━━━━○──────────○
  Placed     Confirmed  Shipped    Out for    Delivered
  15 Aug     15 Aug     17 Aug     delivery
  10:23      12:04      18:45

  Tracking:  Delhivery · AWB 12345678901   [ Track on courier ↗ ]
```

### 8.4 Admin-facing order management

- **Orders list** (`/admin/orders`) — filters: status (multi), date range, payment method, search by order#/phone/email.
- **Order detail** (`/admin/orders/:id`) — items, customer, addresses, payment history, status timeline, actions:
  - `Confirm` (PLACED → CONFIRMED)
  - `Mark packed` (CONFIRMED → PACKED)
  - `Ship` — opens dialog to enter courier + tracking#; sets PACKED → SHIPPED and fires customer notification.
  - `Mark out for delivery` (manual or later via courier webhook)
  - `Mark delivered`
  - `Cancel` — with reason; auto-triggers refund if paid via gateway.
  - `Approve / reject return` (when RETURN_REQUESTED).
  - `Refund` (partial or full, when eligible).
- Every action writes an `OrderStatusEvent` and (where relevant) enqueues a `Notification`.
- **RBAC**: `ORDER_MANAGER` can do everything above **except refunds** (SUPER_ADMIN only).

### 8.5 Notifications (email + SMS)

Triggered on status transitions:

```
  Transition                      Email                SMS
  ─────────────────────────────── ─────────────────── ────────────────
  → PLACED                        Order confirmation  Optional
  → CONFIRMED                     Order confirmed     —
  → SHIPPED                       Shipped + AWB link  Shipped + link
  → OUT_FOR_DELIVERY              —                   OFD update
  → DELIVERED                     Delivery confirm    Delivery confirm
  → CANCELLED / REFUNDED          Cancel + refund ETA Cancel note
  T+3 after DELIVERED             Review request      —
```

Providers: **Resend** (email), **MSG91** (SMS + OTP). Queued via BullMQ + Redis so gateway hiccups don't lose messages.

### 8.6 Money math — order-time snapshot

Critical: prices, discounts, and metal rates all get **snapshotted onto `OrderItem.unitPrice` and `OrderItem.pricingBreakdown` at checkout**. Never re-computed from live data afterwards. This is what makes invoices, returns, and disputes traceable.

```
  LIVE_METAL_RATE item breakdown (stored in pricingBreakdown JSON):
  {
    metalRatePerGram: 6845,
    weightGrams: 8.2,
    purityFactor: 0.916,           // for 22K
    metalValue: 51443.00,
    makingPct: 12,
    makingCharge: 6173.16,
    stoneValue: 12500,
    subtotal: 70116.16,
    productDiscount: 0,
    saleDiscount: 3505.81,          // 5% Diwali sale
    gstPct: 3,
    gstAmount: 1998.31,
    lineTotal: 68608.66
  }
```

---

## 9. Phased roadmap

```
  Phase 1  ── Skeleton + storefront read + admin catalog CRUD
             ─ Nx workspace + 3 apps + shared lib
             ─ Prisma schema (ALL entities, but stubs unused)
             ─ Ivory theme + Tailwind + design tokens + master layouts
             ─ NestJS: auth (admin), categories, products
             ─ Storefront: home, /c/:slug, /p/:slug with SEO + JSON-LD
             ─ Admin: login, products list, create/edit + image upload
             ─ Seed: 3 categories + 10 products
             ─ docker-compose (Postgres + Redis) + .env.example
             ─ Deploy target docs

  Phase 2  ── ✅ Sales, discounts, live gold rate  (shipped in Phase-1.5..1.9)
             ✅ MetalRateDaily + admin "Metal Rates" grid screen
             ✅ Sale + SaleTarget CRUD in admin (per-product override + banner)
             ✅ Coupon CRUD + validation service (/public/coupons/validate)
             ✅ Storefront: sale badges + strike-through pricing on PDP+card
             ✅ Gold-rate ticker wired to latest MetalRateDaily
             ─ /sale campaign landing page (deferred)
             ─ /new-arrivals aggregate page (deferred; individual products
               already surface via isFresh badge)

  Phase 3  ── Customer, cart, checkout, orders, payments
             ─ Customer OTP auth (MSG91)
             ─ Cart (guest sessionId + logged-in persistence)
             ─ Address book
             ─ Checkout (address → summary → payment)
             ─ Razorpay + PayU integration + webhooks
             ─ COD flow
             ─ Order placement + snapshot pricing
             ─ Order status state machine + events
             ─ Admin orders list + detail + status actions
             ─ Customer /account/orders + /account/orders/:orderNumber
             ─ Guest /track flow
             ─ Notifications (Resend + MSG91) via BullMQ

  Phase 4  ── Reviews, wishlist, S3 real, polish
             ─ Reviews (verified buyer + moderation queue)
             ─ Wishlist
             ─ S3 real integration (Phase 1 = mock URLs)
             ─ Reports (sales, top products, low stock)
             ─ GST invoice PDF generation
```

---

## 10. Phase 1 — definition of done

The skeleton is "done" when:

- [ ] `docker compose up` starts Postgres + Redis.
- [ ] `npx nx serve api` starts NestJS on http://localhost:3000.
- [ ] `npx nx serve storefront` starts SSR dev server on http://localhost:4200 with server-rendered HTML (verify via `curl` — no client JS needed to see content).
- [ ] `npx nx serve admin` starts admin CSR on http://localhost:4300.
- [ ] `npx prisma migrate dev && npx prisma db seed` populates 3 categories + 10 products.
- [ ] Storefront home renders category cards from real DB data (SSR).
- [ ] Storefront `/p/:slug` renders PDP with `<title>`, meta description, canonical, JSON-LD Product schema — verifiable via `view-source`.
- [ ] Admin login (seeded superadmin) → redirected to `/products`.
- [ ] Admin can create/edit a product; new/updated product visible on storefront within the next SSR request.
- [ ] Master layout renders on all storefront pages: announcement bar, gold-rate ticker (static values), header, trust badges, footer, mobile bottom nav.
- [ ] Tailwind theme extends with ivory palette + Playfair/Inter fonts.
- [ ] `PLAN.md` in repo root (this file).
- [ ] `README.md` with "how to run" instructions.

---

## 12. Idempotency

Every write endpoint that can be retried by a client or a gateway **must** be safe to call more than once with the same effect. Losing this discipline in e-commerce corrupts money and inventory.

### 12.1 Where idempotency is mandatory

```
  Endpoint / event                              Key source                   Reason
  ────────────────────────────────────────────  ───────────────────────────  ──────────────────────────────
  POST /orders           (place order)          Client-generated UUID        Network retry after 200 must
                                                (Idempotency-Key header)     not create 2nd order.

  POST /payments/:id/capture                    Same as above                Payment retry from client.
  POST /orders/:id/cancel                       Same                         Double-click safety.

  POST /webhooks/razorpay                       Razorpay event.id            Gateway retries webhooks
  POST /webhooks/payu                           PayU txnId + event           until 2xx received.

  POST /admin/orders/:id/status                 Admin action UUID            Fast double-click / retry.
  POST /admin/orders/:id/refund                 Admin action UUID            NEVER refund twice.
  POST /admin/orders/bulk-*                     Batch UUID                   Bulk actions must be replayable.

  Stock adjustments (admin)                     Adjustment UUID              Ledger stays correct on retry.
```

### 12.2 Storage & interceptor

```prisma
model IdempotencyKey {
  key         String   @id                        // client-supplied UUID
  scope       String                              // "orders.place" | "payments.capture" | …
  requestHash String                              // sha256(canonicalized body)
  statusCode  Int
  responseBody Json
  createdAt   DateTime @default(now())
  expiresAt   DateTime                            // key + scope reserved for 24h

  @@unique([key, scope])
  @@index([expiresAt])
}

model PaymentEvent {
  id              String   @id @default(uuid())
  payment         Payment  @relation(fields: [paymentId], references: [id])
  paymentId       String
  gatewayEventId  String   @unique                // Razorpay event.id / PayU txnId+status
  eventType       String                          // "authorized" | "captured" | "failed" | "refunded"
  rawPayload      Json
  receivedAt      DateTime @default(now())
}
```

`IdempotencyInterceptor` (NestJS, applied by decorator on relevant handlers):

```
   Request arrives
        │
        ▼
   Has Idempotency-Key?  ── no ──▶  { scope requires key? } ── yes ─▶ 400 "Missing key"
        │ yes                                            └── no ────▶ proceed normally
        ▼
   Lookup (key, scope)
        │
        ├─ found + same requestHash ─▶ return cached { statusCode, responseBody }
        │
        ├─ found + different hash    ─▶ 422 "Idempotency key reused with different payload"
        │
        └─ not found ─▶ acquire advisory lock on key ─▶ execute handler
                                                     ─▶ persist { statusCode, response }
                                                     ─▶ release lock
                                                     ─▶ return response
```

### 12.3 Webhook idempotency (Razorpay / PayU)

- Handler reads event ID from payload, does `INSERT INTO PaymentEvent (gatewayEventId, …) ON CONFLICT DO NOTHING`.
- If 0 rows inserted → already processed, return 200 immediately (gateway stops retrying).
- If 1 row inserted → apply the state change inside the same transaction that inserts the OrderStatusEvent + updates Payment.
- Signature verification (Razorpay `X-Razorpay-Signature`, PayU hash) happens BEFORE the insert — reject unsigned events at the edge.

### 12.4 Client responsibilities

- Storefront checkout screen generates the `Idempotency-Key` UUID once when the "Place Order" button is first enabled, keeps it across retries of the same click.
- Admin app generates one UUID per user action (per row click, per bulk-op submit).
- Both apps include it as `Idempotency-Key: <uuid>` header.

---

## 13. Inventory management

Money-safety and inventory-safety are the two invariants this app cannot violate. The design:

### 13.1 Where stock lives (Phase 1 shape)

Add two fields to `Product`:

```prisma
model Product {
  // ... existing fields ...
  stock              Int      @default(0)
  lowStockThreshold  Int      @default(3)         // dashboards + PDP "only N left"
  allowBackorder     Boolean  @default(false)     // rare for jewelry, useful for made-to-order
}
```

(Phase 4+ if variants like ring size are added: introduce `ProductVariant` and move `stock` down to variant level. Not needed for MVP.)

### 13.2 Append-only stock ledger (the truth)

```prisma
enum StockReason {
  ORDER_PLACED        // negative
  ORDER_CANCELLED     // positive (restock)
  ORDER_RETURNED      // positive (restock after inspection)
  PAYMENT_FAILED      // positive (compensate ORDER_PLACED)
  ADMIN_ADJUSTMENT    // signed
  INITIAL_LOAD        // positive
  RECONCILIATION      // signed (from nightly job)
}

model StockLedger {
  id          String       @id @default(uuid())
  product     Product      @relation(fields: [productId], references: [id])
  productId   String
  delta       Int                                  // signed
  reason      StockReason
  referenceType String?                            // "order" | "adjustment" | "return"
  referenceId   String?
  actorType   String                               // "SYSTEM" | "ADMIN" | "WEBHOOK"
  actorId     String?
  note        String?
  createdAt   DateTime     @default(now())

  @@index([productId, createdAt])
  @@index([referenceType, referenceId])
}
```

**Invariant**: `Product.stock == SUM(StockLedger.delta WHERE productId = X)` for every product.

A nightly cron reconciles this and alerts on drift. Drift = bug; the ledger is authoritative if numbers diverge.

### 13.3 Deduction timing decision

Three candidate strategies:

```
   Strategy                        Reserves during payment?   Oversell risk?    Complexity
   ─────────────────────────────── ────────────────────────── ────────────────  ────────────────
   A: Deduct at cart-add           Yes, long (whole session)  Very low          High (TTL sweeper)
   B: Deduct at ORDER PLACED       Yes, short (payment win)   Low               Low  ← chosen
   C: Deduct at PAYMENT CAPTURED   No                         Medium-High       Low
```

**Chosen: B**. Deduct atomically at order placement, inside the same DB transaction that creates the Order + OrderItem + Payment(INITIATED) + OrderStatusEvent(→PLACED) + StockLedger(-qty). Payment window is short (typically < 15 min); short reservations are acceptable for jewelry.

Compensation on payment failure or cancellation: **restock** with a new StockLedger row (+qty, reason `PAYMENT_FAILED` or `ORDER_CANCELLED`). Never delete or "undo" a ledger row — always compensate.

### 13.4 Concurrency-safe deduction (the atomic check)

Multiple shoppers may click "Place Order" for the last unit at the same instant. The check-and-decrement must be a single SQL statement:

```sql
UPDATE "Product"
   SET stock = stock - $qty
 WHERE id = $productId
   AND (stock >= $qty OR "allowBackorder" = true)
RETURNING stock;
```

- Returns 1 row → success; use the returned `stock` value.
- Returns 0 rows → insufficient stock; the transaction rolls back and the API returns `409 Conflict` with `{ productId, availableStock }`.

Prisma equivalent: `prisma.$executeRaw` inside `$transaction`. All items in the order are checked in a single tx, ordered by `productId` to prevent deadlocks between concurrent multi-item orders.

### 13.5 Order-placement flow (with stock + idempotency)

```
   Client: POST /orders  +  Idempotency-Key: <uuid>
        │
        ▼
   IdempotencyInterceptor → { cache hit → return } | { proceed }
        │
        ▼
   BEGIN TRANSACTION  (SERIALIZABLE, or REPEATABLE READ with per-row locks)
        │
        │  1. Re-fetch each product with the atomic UPDATE above
        │     ─ any row returns 0 → ROLLBACK, respond 409
        │
        │  2. Recompute prices from server-side (never trust client cart totals)
        │     ─ apply active Sale/Coupon/product-discount rules server-side
        │
        │  3. INSERT Order (status = PLACED, snapshotted totals)
        │  4. INSERT OrderItem[] with pricingBreakdown snapshots
        │  5. INSERT StockLedger[] (-qty each) with referenceType='order'
        │  6. INSERT Payment (INITIATED, method)
        │  7. INSERT OrderStatusEvent (null → PLACED, SYSTEM)
        │  8. Enqueue Notification job (order confirmation)
        │
        ▼
   COMMIT
        │
        ▼
   Persist idempotency cache { key, hash, 201, orderNumber, … }
        │
        ▼
   Return 201 { orderNumber, paymentSessionUrl, … }
```

### 13.6 Restock triggers (all write StockLedger rows)

```
   Event                                     Delta      Reason              Actor
   ────────────────────────────────────────  ─────────  ──────────────────  ───────────
   Payment webhook → FAILED                  +qty       PAYMENT_FAILED      WEBHOOK
   Customer cancels (PLACED / CONFIRMED)     +qty       ORDER_CANCELLED     CUSTOMER
   Admin cancels (any pre-ship status)       +qty       ORDER_CANCELLED     ADMIN
   Return goods inspected & approved         +qty       ORDER_RETURNED      ADMIN
   Admin adjusts stock (recount)             ±delta     ADMIN_ADJUSTMENT    ADMIN
```

Returns are two-step: `RETURN_REQUESTED → RETURNED` writes the ledger row only when the admin clicks "Restock" during inspection (some returned items are damaged; admin can approve refund without restocking).

### 13.7 PDP display rules

```
   Server-computed state                            PDP UI                          Add-to-cart
   ───────────────────────────────────────────────  ─────────────────────────────   ────────────
   stock > lowStockThreshold                        "In stock"           (success)  Enabled
   0 < stock <= lowStockThreshold                   "Only N left"        (warning)  Enabled
   stock == 0 AND allowBackorder == true            "Ships in 2-3 weeks" (info)     Enabled
   stock == 0 AND allowBackorder == false           "Out of stock"       (danger)   Disabled + "Notify me" (P4)
   product.isActive == false                        Not listed / 410
```

### 13.8 Admin inventory tooling

- **Products list** shows a `Stock` column with color: green (> threshold) / yellow (≤ threshold) / red (0).
- **Product detail** has a "Stock" tab: current stock, threshold, backorder toggle, and a scrollable ledger view (`StockLedger` rows for this product, newest first).
- **Bulk adjust** — CSV upload for stock recounts; each row emits an `ADMIN_ADJUSTMENT` ledger entry with the CSV upload UUID as `referenceId` (idempotent via §12).
- **Low-stock dashboard widget** — count of products at/below threshold + jump link.
- **Reconciliation job report** — email to `SUPER_ADMIN` if drift detected.

### 13.9 What's in Phase 1 vs later

```
   Phase 1 (schema-only):
     ─ Product.stock, lowStockThreshold, allowBackorder fields exist
     ─ Admin can set stock via the product edit form (direct write)
     ─ Storefront respects PDP display rules (§13.7) even without cart

   Phase 3 (activated fully):
     ─ StockLedger table + atomic deduction on ORDER PLACED
     ─ Compensation on payment failure & cancel
     ─ Return-approved restocking
     ─ Idempotency (§12) end-to-end

   Phase 4:
     ─ Nightly reconciliation cron + drift alerts
     ─ Bulk-adjust CSV
     ─ Low-stock digest email
     ─ "Notify me when back" waitlist
```

---

## 14. Open questions to revisit before Phase 3

- Which specific courier(s) will you use? (Delhivery / Bluedart / Shiprocket aggregator) — affects Shipment fields + integration priority.
- Do you want partial refunds / partial returns (per-item), or only whole-order returns for MVP?
- GST rate — flat 3% on total, or 3% on metal + 5% on making charges (older GST regime)?
- Do you need a Tax Invoice PDF at delivery, or just at order placement?
- Any dropshipping / vendor multi-store setup, or single-vendor only?
