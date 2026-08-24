// Shared serialization for API product responses. Consumers:
//   - ProductsService.list*/byId
//   - CategoriesService.publicBySlug (products embedded in a category)

import { PricingMode, Product } from '@prisma/client';
import { computeProductPrice, computeStockDisplay } from './pricing';

export type ProductWithMaybeCategory = Product & {
  category?: { id: string; slug: string; name: string; pricingMode: PricingMode } | null;
};

export interface ActiveSaleInfo {
  saleId: string;
  saleName: string;
  discountPct: number;
}

export function serializeProduct(
  p: ProductWithMaybeCategory,
  categoryPricingMode?: PricingMode,
  activeSale?: ActiveSaleInfo | null,
) {
  const mode = p.category?.pricingMode ?? categoryPricingMode;
  if (!mode) {
    throw new Error(`serializeProduct: pricingMode not resolvable for product ${p.id}`);
  }

  const productDiscount = p.specialDiscount ? Number(p.specialDiscount) : 0;
  const saleDiscount = activeSale?.discountPct ?? 0;
  const effectivePct = Math.max(productDiscount, saleDiscount);
  const discountSource: 'sale' | 'product' | null =
    effectivePct === 0 ? null : saleDiscount >= productDiscount ? 'sale' : 'product';

  // computeProductPrice reads `specialDiscount` off the input — swap in the effective %.
  const price = computeProductPrice({ ...p, specialDiscount: effectivePct }, mode);
  const stockDisplay = computeStockDisplay(p.stock, p.lowStockThreshold, p.allowBackorder);

  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    description: p.description,
    images: p.images,
    isFresh: p.isFresh,
    isActive: p.isActive,
    category: p.category ?? null,
    metal: p.metal,
    purity: p.purity,
    weightGrams: p.weightGrams ? Number(p.weightGrams) : null,
    makingPct: p.makingPct ? Number(p.makingPct) : null,
    mrp: p.mrp ? Number(p.mrp) : null,
    specialDiscount: productDiscount,
    price,
    stockDisplay,
    // Sale badge info when a sale drives the discount
    sale: discountSource === 'sale' && activeSale
      ? { id: activeSale.saleId, name: activeSale.saleName, discountPct: activeSale.discountPct }
      : null,
  };
}
