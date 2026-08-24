// Seed script — 1 super-admin + 3 categories + 10 products.
// Run: npm run db:seed  (see root package.json)

import { PrismaClient, PricingMode, Metal, Purity, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding…');

  // ── Super admin ─────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin@12345', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@ecom-shop.dev' },
    update: {},
    create: {
      email: 'admin@ecom-shop.dev',
      passwordHash: adminPassword,
      fullName: 'Root Admin',
      role: AdminRole.SUPER_ADMIN,
    },
  });
  console.log(`  Admin: ${admin.email} / admin@12345`);

  // ── Categories ──────────────────────────────────────────────────────
  const categoriesData = [
    {
      slug: 'gold-rings',
      name: 'Gold Rings',
      description: 'Traditional and modern 22K gold rings.',
      pricingMode: PricingMode.LIVE_METAL_RATE,
      heroImageUrl: 'https://placehold.co/1600x900/F1EADD/1F1B16?text=Gold+Rings&font=playfair-display',
      sortOrder: 1,
    },
    {
      slug: 'diamond-jewelry',
      name: 'Diamond Jewelry',
      description: 'Certified diamond pieces with fixed MRP.',
      pricingMode: PricingMode.FIXED_MRP,
      heroImageUrl: 'https://placehold.co/1600x900/F1EADD/1F1B16?text=Diamond+Jewelry&font=playfair-display',
      sortOrder: 2,
    },
    {
      slug: 'silver-collection',
      name: 'Silver Collection',
      description: 'Everyday silver pieces at live silver rates.',
      pricingMode: PricingMode.LIVE_METAL_RATE,
      heroImageUrl: 'https://placehold.co/1600x900/F1EADD/1F1B16?text=Silver+Collection&font=playfair-display',
      sortOrder: 3,
    },
  ];

  const categories = await Promise.all(
    categoriesData.map(c =>
      prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c }),
    ),
  );
  console.log(`  Categories: ${categories.map(c => c.slug).join(', ')}`);

  const [rings, diamonds, silver] = categories;

  // ── Products ────────────────────────────────────────────────────────
  // Placeholder images use placehold.co with the ivory-luxury palette
  // (bg=F1EADD, ink=1F1B16) — swap for real S3-hosted photos via admin uploads.
  const img = (name: string, view: string) =>
    `https://placehold.co/800x1000/F1EADD/1F1B16?text=${encodeURIComponent(name)}%0A${encodeURIComponent(view)}&font=playfair-display`;

  const productsData = [
    // Gold rings — LIVE_METAL_RATE
    {
      slug: 'classic-band-22k', sku: 'GR-CB-22K-01', name: 'Classic Band 22K',
      description: 'Timeless plain band in 22-karat gold. Ideal for daily wear.',
      categoryId: rings.id,
      images: [img('Classic Band 22K', 'front'), img('Classic Band 22K', 'side'), img('Classic Band 22K', 'worn'), img('Classic Band 22K', 'detail')],
      stock: 12, isFresh: true, metal: Metal.GOLD, purity: Purity.K22, weightGrams: 4.20, makingPct: 8, stoneValue: 0,
    },
    {
      slug: 'temple-ring-22k', sku: 'GR-TR-22K-02', name: 'Temple Motif Ring 22K',
      description: 'Traditional South-Indian temple design with fine detailing.',
      categoryId: rings.id,
      images: [img('Temple Motif Ring', 'front'), img('Temple Motif Ring', 'top'), img('Temple Motif Ring', 'detail')],
      stock: 5, metal: Metal.GOLD, purity: Purity.K22, weightGrams: 6.80, makingPct: 15, stoneValue: 0,
    },
    {
      slug: 'minimal-ring-18k', sku: 'GR-MN-18K-03', name: 'Minimal Ring 18K',
      description: 'Slim, contemporary silhouette. 18K rose gold.',
      categoryId: rings.id,
      images: [img('Minimal Ring 18K', 'front'), img('Minimal Ring 18K', 'stack'), img('Minimal Ring 18K', 'worn')],
      stock: 2, isFresh: true, metal: Metal.GOLD, purity: Purity.K18, weightGrams: 2.30, makingPct: 10, stoneValue: 0,
    },
    {
      slug: 'engagement-ring-22k', sku: 'GR-ER-22K-04', name: 'Engagement Ring 22K',
      description: 'Elegant solitaire mount ready for a center stone.',
      categoryId: rings.id,
      images: [img('Engagement Ring', 'front'), img('Engagement Ring', 'side'), img('Engagement Ring', 'top'), img('Engagement Ring', 'worn')],
      stock: 0, metal: Metal.GOLD, purity: Purity.K22, weightGrams: 5.50, makingPct: 18, stoneValue: 0,
    },

    // Diamonds — FIXED_MRP
    {
      slug: 'diamond-solitaire-pendant', sku: 'DM-SP-01', name: 'Solitaire Pendant 0.30ct',
      description: 'IGI-certified 0.30ct round-brilliant solitaire in 18K white gold.',
      categoryId: diamonds.id,
      images: [img('Solitaire Pendant', 'front'), img('Solitaire Pendant', 'worn'), img('Solitaire Pendant', 'certificate')],
      stock: 8, mrp: 45000, specialDiscount: 5,
    },
    {
      slug: 'diamond-studs-half-ct', sku: 'DM-ST-02', name: 'Diamond Studs 0.50ct',
      description: 'Pair of matched round-brilliant studs. IGI-certified.',
      categoryId: diamonds.id,
      images: [img('Diamond Studs', 'pair'), img('Diamond Studs', 'worn'), img('Diamond Studs', 'detail')],
      stock: 4, isFresh: true, mrp: 82500,
    },
    {
      slug: 'diamond-tennis-bracelet', sku: 'DM-TB-03', name: 'Tennis Bracelet 1.20ct',
      description: 'Continuous line of round diamonds set in 18K gold.',
      categoryId: diamonds.id,
      images: [img('Tennis Bracelet', 'straight'), img('Tennis Bracelet', 'wrist'), img('Tennis Bracelet', 'clasp')],
      stock: 1, mrp: 215000, specialDiscount: 10,
    },

    // Silver — LIVE_METAL_RATE
    {
      slug: 'silver-toe-rings', sku: 'SV-TR-01', name: 'Silver Toe Rings (Pair)',
      description: 'Traditional silver toe rings. Adjustable.',
      categoryId: silver.id,
      images: [img('Silver Toe Rings', 'pair'), img('Silver Toe Rings', 'worn')],
      stock: 30, metal: Metal.SILVER, purity: Purity.K24, weightGrams: 3.20, makingPct: 20, stoneValue: 0,
    },
    {
      slug: 'silver-anklet-payal', sku: 'SV-AN-02', name: 'Silver Anklet Payal',
      description: 'Handcrafted anklet with fine ghungroo detailing.',
      categoryId: silver.id,
      images: [img('Silver Anklet', 'flat'), img('Silver Anklet', 'worn'), img('Silver Anklet', 'detail')],
      stock: 10, isFresh: true, metal: Metal.SILVER, purity: Purity.K24, weightGrams: 22.5, makingPct: 15, stoneValue: 0,
    },
    {
      slug: 'silver-nose-pin', sku: 'SV-NP-03', name: 'Silver Nose Pin',
      description: 'Tiny star-shaped nose pin.',
      categoryId: silver.id,
      images: [img('Silver Nose Pin', 'front'), img('Silver Nose Pin', 'worn')],
      stock: 50, metal: Metal.SILVER, purity: Purity.K24, weightGrams: 0.4, makingPct: 30, stoneValue: 0,
    },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p as any,
      create: p as any,
    });
  }
  console.log(`  Products: ${productsData.length} seeded`);

  console.log('Done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
