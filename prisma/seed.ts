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
      heroImageUrl: 'https://picsum.photos/seed/gold-rings/1600/900',
      sortOrder: 1,
    },
    {
      slug: 'diamond-jewelry',
      name: 'Diamond Jewelry',
      description: 'Certified diamond pieces with fixed MRP.',
      pricingMode: PricingMode.FIXED_MRP,
      heroImageUrl: 'https://picsum.photos/seed/diamond/1600/900',
      sortOrder: 2,
    },
    {
      slug: 'silver-collection',
      name: 'Silver Collection',
      description: 'Everyday silver pieces at live silver rates.',
      pricingMode: PricingMode.LIVE_METAL_RATE,
      heroImageUrl: 'https://picsum.photos/seed/silver/1600/900',
      sortOrder: 3,
    },
  ];

  const categories = await Promise.all(
    categoriesData.map(c =>
      prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c }),
    ),
  );
  console.log(`  Categories: ${categories.map(c => c.slug).join(', ')}`);

  const [rings, diamonds, silver] = categories;

  // ── Products ────────────────────────────────────────────────────────
  const productsData = [
    // Gold rings — LIVE_METAL_RATE
    {
      slug: 'classic-band-22k', sku: 'GR-CB-22K-01', name: 'Classic Band 22K',
      description: 'Timeless plain band in 22-karat gold. Ideal for daily wear.',
      categoryId: rings.id,
      images: ['https://picsum.photos/seed/ring1/800/1000', 'https://picsum.photos/seed/ring1b/800/1000'],
      stock: 12, isFresh: true, metal: Metal.GOLD, purity: Purity.K22, weightGrams: 4.20, makingPct: 8, stoneValue: 0,
    },
    {
      slug: 'temple-ring-22k', sku: 'GR-TR-22K-02', name: 'Temple Motif Ring 22K',
      description: 'Traditional South-Indian temple design with fine detailing.',
      categoryId: rings.id,
      images: ['https://picsum.photos/seed/ring2/800/1000'],
      stock: 5, metal: Metal.GOLD, purity: Purity.K22, weightGrams: 6.80, makingPct: 15, stoneValue: 0,
    },
    {
      slug: 'minimal-ring-18k', sku: 'GR-MN-18K-03', name: 'Minimal Ring 18K',
      description: 'Slim, contemporary silhouette. 18K rose gold.',
      categoryId: rings.id,
      images: ['https://picsum.photos/seed/ring3/800/1000'],
      stock: 2, isFresh: true, metal: Metal.GOLD, purity: Purity.K18, weightGrams: 2.30, makingPct: 10, stoneValue: 0,
    },
    {
      slug: 'engagement-ring-22k', sku: 'GR-ER-22K-04', name: 'Engagement Ring 22K',
      description: 'Elegant solitaire mount ready for a center stone.',
      categoryId: rings.id,
      images: ['https://picsum.photos/seed/ring4/800/1000'],
      stock: 0, metal: Metal.GOLD, purity: Purity.K22, weightGrams: 5.50, makingPct: 18, stoneValue: 0,
    },

    // Diamonds — FIXED_MRP
    {
      slug: 'diamond-solitaire-pendant', sku: 'DM-SP-01', name: 'Solitaire Pendant 0.30ct',
      description: 'IGI-certified 0.30ct round-brilliant solitaire in 18K white gold.',
      categoryId: diamonds.id,
      images: ['https://picsum.photos/seed/dia1/800/1000'],
      stock: 8, mrp: 45000, specialDiscount: 5,
    },
    {
      slug: 'diamond-studs-half-ct', sku: 'DM-ST-02', name: 'Diamond Studs 0.50ct',
      description: 'Pair of matched round-brilliant studs. IGI-certified.',
      categoryId: diamonds.id,
      images: ['https://picsum.photos/seed/dia2/800/1000'],
      stock: 4, isFresh: true, mrp: 82500,
    },
    {
      slug: 'diamond-tennis-bracelet', sku: 'DM-TB-03', name: 'Tennis Bracelet 1.20ct',
      description: 'Continuous line of round diamonds set in 18K gold.',
      categoryId: diamonds.id,
      images: ['https://picsum.photos/seed/dia3/800/1000'],
      stock: 1, mrp: 215000, specialDiscount: 10,
    },

    // Silver — LIVE_METAL_RATE
    {
      slug: 'silver-toe-rings', sku: 'SV-TR-01', name: 'Silver Toe Rings (Pair)',
      description: 'Traditional silver toe rings. Adjustable.',
      categoryId: silver.id,
      images: ['https://picsum.photos/seed/sv1/800/1000'],
      stock: 30, metal: Metal.SILVER, purity: Purity.K24, weightGrams: 3.20, makingPct: 20, stoneValue: 0,
    },
    {
      slug: 'silver-anklet-payal', sku: 'SV-AN-02', name: 'Silver Anklet Payal',
      description: 'Handcrafted anklet with fine ghungroo detailing.',
      categoryId: silver.id,
      images: ['https://picsum.photos/seed/sv2/800/1000'],
      stock: 10, isFresh: true, metal: Metal.SILVER, purity: Purity.K24, weightGrams: 22.5, makingPct: 15, stoneValue: 0,
    },
    {
      slug: 'silver-nose-pin', sku: 'SV-NP-03', name: 'Silver Nose Pin',
      description: 'Tiny star-shaped nose pin.',
      categoryId: silver.id,
      images: ['https://picsum.photos/seed/sv3/800/1000'],
      stock: 50, metal: Metal.SILVER, purity: Purity.K24, weightGrams: 0.4, makingPct: 30, stoneValue: 0,
    },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
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
