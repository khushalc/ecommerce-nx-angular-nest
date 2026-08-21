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

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pricingMode: PricingMode;
  heroImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
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
