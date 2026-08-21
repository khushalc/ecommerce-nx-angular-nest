// Shared serialization for API product responses. Both CategoriesService (when
// returning a category-with-products) and ProductsService return the same shape.

import { PricingMode, Product } from '@prisma/client';
import { computeProductPrice, computeStockDisplay } from './pricing';

export type ProductWithMaybeCategory = Product & {
  category?: { id: string; slug: string; name: string; pricingMode: PricingMode } | null;
};

export function serializeProduct(
  p: ProductWithMaybeCategory,
  categoryPricingMode?: PricingMode,
) {
  const mode = p.category?.pricingMode ?? categoryPricingMode;
  if (!mode) {
    throw new Error(`serializeProduct: pricingMode not resolvable for product ${p.id}`);
  }
  const price = computeProductPrice(p, mode);
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
    specialDiscount: p.specialDiscount ? Number(p.specialDiscount) : 0,
    price,
    stockDisplay,
  };
}
