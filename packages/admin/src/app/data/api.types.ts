export type AdminRole = 'SUPER_ADMIN' | 'CATALOG_MANAGER' | 'ORDER_MANAGER';
export type PricingMode = 'LIVE_METAL_RATE' | 'FIXED_MRP';
export type Metal = 'GOLD' | 'SILVER' | 'PLATINUM';
export type Purity = 'K14' | 'K18' | 'K22' | 'K24';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

export interface CategoryRef {
  id: string;
  slug: string;
  name: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pricingMode: PricingMode;
  heroImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  parent?: CategoryRef | null;
  children?: Category[];
  _count?: { products: number; children: number };
}

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  pricingMode?: PricingMode;   // required only when parentId is null
  parentId?: string | null;
  heroImageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ProductPrice {
  pricingMode: PricingMode;
  finalPrice: number;
  listPrice: number;
  discountPct: number;
  currency: 'INR';
}

export interface StockDisplay {
  state: 'IN_STOCK' | 'LOW' | 'BACKORDER' | 'OUT_OF_STOCK';
  message: string;
  qty: number;
  canAddToCart: boolean;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string | null;
  images: string[];
  isFresh: boolean;
  isActive: boolean;
  category: { id: string; slug: string; name: string; pricingMode: PricingMode };
  metal: Metal | null;
  purity: Purity | null;
  weightGrams: number | null;
  makingPct: number | null;
  mrp: number | null;
  specialDiscount: number;
  price: ProductPrice;
  stockDisplay: StockDisplay;
  sale: { id: string; name: string; discountPct: number } | null;
}

export interface Paginated<T> { items: T[]; total: number; }

export interface CreateProductPayload {
  name: string;
  slug: string;
  sku: string;
  description?: string;
  categoryId: string;
  images?: string[];
  isActive?: boolean;
  isFresh?: boolean;
  specialDiscount?: number;
  stock?: number;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
  mrp?: number;
  metal?: Metal;
  purity?: Purity;
  weightGrams?: number;
  makingPct?: number;
  stoneValue?: number;
}

export interface Sale {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  bannerImageUrl: string | null;
  bannerLabel: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  showInBanner: boolean;
  defaultDiscountPct: number | null;
  maxDiscountPerCart: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { targets: number };
  targets?: SaleTarget[];
}

export interface SaleTarget {
  saleId: string;
  productId: string;
  discountPctOverride: number | null;
  product?: {
    id: string;
    slug: string;
    sku: string;
    name: string;
    images: string[];
    category: { id: string; slug: string; name: string; pricingMode: PricingMode };
  };
}

export interface CreateSalePayload {
  name: string;
  slug: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
  bannerImageUrl?: string;
  bannerLabel?: string;
  ctaLabel?: string;
  ctaHref?: string;
  showInBanner?: boolean;
  defaultDiscountPct?: number;
  maxDiscountPerCart?: number;
}

export interface SaleTargetInput {
  productId: string;
  discountPctOverride?: number | null;
}

export interface BulkResult {
  updated: number;
}

// ── Coupons ────────────────────────────────────────────────────────────

export type CouponType = 'PERCENT' | 'FLAT';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: CouponType;
  discountValue: number | string;
  minCartValue: number | string | null;
  maxDiscount: number | string | null;
  perCustomerCap: number | null;
  totalUsageCap: number | null;
  totalUsageCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discountType: CouponType;
  discountValue: number;
  minCartValue?: number;
  maxDiscount?: number;
  perCustomerCap?: number;
  totalUsageCap?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

// ── Metal rates ────────────────────────────────────────────────────────

export interface RateEntry {
  metal: Metal;
  purity: Purity;
  ratePerGram: number;
  previousRate: number | null;
  direction: 'up' | 'down' | 'flat';
}

export interface TodayRates {
  date: string;
  rates: RateEntry[];
}

export interface UpsertRateItem {
  metal: Metal;
  purity: Purity;
  ratePerGram: number;
}
