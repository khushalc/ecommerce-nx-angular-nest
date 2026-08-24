// Public API response shapes returned by the NestJS backend.
// Kept as loose interfaces so the storefront isn't coupled to @prisma/client types.

export interface CategoryRef {
  id: string;
  slug: string;
  name: string;
}

export interface CategorySummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pricingMode: 'LIVE_METAL_RATE' | 'FIXED_MRP';
  heroImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  children?: CategorySummary[];
}

export interface CategoryWithProducts extends CategorySummary {
  parent?: CategoryRef | null;
  children: CategorySummary[];
  products: ProductSummary[];
  isLeaf: boolean;
}

export interface ProductPrice {
  pricingMode: 'LIVE_METAL_RATE' | 'FIXED_MRP';
  finalPrice: number;
  listPrice: number;
  discountPct: number;
  currency: 'INR';
  breakdown?: {
    metalRatePerGram: number;
    weightGrams: number;
    purityFactor: number;
    metalValue: number;
    makingCharge: number;
    stoneValue: number;
    subtotal: number;
  };
}

export interface StockDisplay {
  state: 'IN_STOCK' | 'LOW' | 'BACKORDER' | 'OUT_OF_STOCK';
  message: string;
  qty: number;
  canAddToCart: boolean;
}

export interface ProductSummary {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string | null;
  images: string[];
  isFresh: boolean;
  isActive: boolean;
  category: { id: string; slug: string; name: string; pricingMode: 'LIVE_METAL_RATE' | 'FIXED_MRP' };
  metal: 'GOLD' | 'SILVER' | 'PLATINUM' | null;
  purity: 'K14' | 'K18' | 'K22' | 'K24' | null;
  weightGrams: number | null;
  makingPct: number | null;
  mrp: number | null;
  specialDiscount: number;
  price: ProductPrice;
  stockDisplay: StockDisplay;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}
