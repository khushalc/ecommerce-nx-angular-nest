// Pricing helpers. Phase 1: uses hardcoded fallback metal rates.
// Phase 2 will replace `getMetalRate` with a MetalRateDaily DB lookup.

import { Metal, PricingMode, Purity } from '@prisma/client';
import { ProductPrice, StockDisplay } from './dto';

const PURITY_FACTOR: Record<Purity, number> = {
  K14: 0.585,
  K18: 0.750,
  K22: 0.916,
  K24: 0.999,
};

// Static per-gram rates in INR (per-purity for gold, per-gram for silver/platinum).
// These are placeholders until Phase 2's MetalRateDaily table + admin control.
const FALLBACK_RATES: Record<Metal, number> = {
  GOLD:     7465,   // 24K rate; purity factor applied downstream
  SILVER:     94,
  PLATINUM: 3200,
};

function toNumber(v: unknown, fallback = 0): number {
  if (v == null) return fallback;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function getMetalRate(metal: Metal, _purity: Purity): number {
  // Phase 1 fallback. Phase 2: DB lookup.
  return FALLBACK_RATES[metal];
}

/**
 * Compute customer-facing price for a product given its category's pricingMode.
 */
export function computeProductPrice(
  product: {
    pricingMode?: PricingMode;
    mrp?: unknown;
    metal?: Metal | null;
    purity?: Purity | null;
    weightGrams?: unknown;
    makingPct?: unknown;
    stoneValue?: unknown;
    specialDiscount?: unknown;
  },
  categoryPricingMode: PricingMode,
): ProductPrice {
  const discountPct = toNumber(product.specialDiscount, 0);

  if (categoryPricingMode === PricingMode.FIXED_MRP) {
    const mrp = toNumber(product.mrp, 0);
    const finalPrice = Math.round(mrp * (1 - discountPct / 100));
    return {
      pricingMode: 'FIXED_MRP',
      listPrice: mrp,
      finalPrice,
      discountPct,
      currency: 'INR',
    };
  }

  // LIVE_METAL_RATE
  const metal = product.metal;
  const purity = product.purity;
  if (!metal || !purity) {
    return { pricingMode: 'LIVE_METAL_RATE', listPrice: 0, finalPrice: 0, discountPct, currency: 'INR' };
  }

  const rate = getMetalRate(metal, purity);
  const weight = toNumber(product.weightGrams, 0);
  const makingPct = toNumber(product.makingPct, 0);
  const stoneValue = toNumber(product.stoneValue, 0);
  const purityFactor = metal === Metal.GOLD ? PURITY_FACTOR[purity] : 1;

  const metalValue = rate * weight * purityFactor;
  const makingCharge = metalValue * (makingPct / 100);
  const subtotal = metalValue + makingCharge + stoneValue;
  const listPrice = Math.round(subtotal);
  const finalPrice = Math.round(subtotal * (1 - discountPct / 100));

  return {
    pricingMode: 'LIVE_METAL_RATE',
    listPrice,
    finalPrice,
    discountPct,
    currency: 'INR',
    breakdown: {
      metalRatePerGram: rate,
      weightGrams: weight,
      purityFactor,
      metalValue: Math.round(metalValue),
      makingCharge: Math.round(makingCharge),
      stoneValue,
      subtotal: listPrice,
    },
  };
}

/**
 * Stock display state per PLAN.md §13.7.
 */
export function computeStockDisplay(
  stock: number,
  lowStockThreshold: number,
  allowBackorder: boolean,
): StockDisplay {
  if (stock <= 0) {
    if (allowBackorder) {
      return { state: 'BACKORDER', message: 'Ships in 2-3 weeks', qty: 0, canAddToCart: true };
    }
    return { state: 'OUT_OF_STOCK', message: 'Out of stock', qty: 0, canAddToCart: false };
  }
  if (stock <= lowStockThreshold) {
    return { state: 'LOW', message: `Only ${stock} left`, qty: stock, canAddToCart: true };
  }
  return { state: 'IN_STOCK', message: 'In stock', qty: stock, canAddToCart: true };
}
