import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, SetSaleTargetsDto, UpdateSaleDto, ActiveBannerResponse } from './dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public ──────────────────────────────────────────────────────────

  /** Newest active sale eligible for the announcement banner (or null). */
  async getActiveBanner(now = new Date()): Promise<ActiveBannerResponse | null> {
    const sale = await this.prisma.sale.findFirst({
      where: {
        isActive: true,
        showInBanner: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!sale) return null;
    return {
      id: sale.id,
      name: sale.name,
      bannerLabel: sale.bannerLabel ?? sale.name,
      bannerImageUrl: sale.bannerImageUrl,
      ctaLabel: sale.ctaLabel,
      ctaHref: sale.ctaHref,
      startsAt: sale.startsAt,
      endsAt: sale.endsAt,
    };
  }

  /**
   * All active sales relevant for a given product (used by pricing).
   * Returns the best (highest) discount available to that product.
   * null if no sale applies.
   */
  async getActiveDiscountForProduct(productId: string, now = new Date()) {
    const target = await this.prisma.saleTarget.findFirst({
      where: {
        productId,
        sale: {
          isActive: true,
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
      },
      include: { sale: { select: { id: true, name: true, defaultDiscountPct: true } } },
      orderBy: { sale: { createdAt: 'desc' } },
    });
    if (!target) return null;
    const pct = Number(target.discountPctOverride ?? target.sale.defaultDiscountPct ?? 0);
    if (pct <= 0) return null;
    return { saleId: target.sale.id, saleName: target.sale.name, discountPct: pct };
  }

  /** Batched version — for lists of products. Returns Map<productId, {…}>. */
  async getActiveDiscountsForProducts(productIds: string[], now = new Date()) {
    if (productIds.length === 0) return new Map<string, { saleId: string; saleName: string; discountPct: number }>();

    const targets = await this.prisma.saleTarget.findMany({
      where: {
        productId: { in: productIds },
        sale: {
          isActive: true,
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
      },
      include: { sale: { select: { id: true, name: true, defaultDiscountPct: true, createdAt: true } } },
    });

    const bestByProduct = new Map<string, { saleId: string; saleName: string; discountPct: number; saleCreatedAt: Date }>();
    for (const t of targets) {
      const pct = Number(t.discountPctOverride ?? t.sale.defaultDiscountPct ?? 0);
      if (pct <= 0) continue;
      const existing = bestByProduct.get(t.productId);
      // Prefer higher discount, then more recent sale
      if (!existing || pct > existing.discountPct ||
          (pct === existing.discountPct && t.sale.createdAt > existing.saleCreatedAt)) {
        bestByProduct.set(t.productId, {
          saleId: t.sale.id,
          saleName: t.sale.name,
          discountPct: pct,
          saleCreatedAt: t.sale.createdAt,
        });
      }
    }

    // Drop createdAt from the returned shape
    const out = new Map<string, { saleId: string; saleName: string; discountPct: number }>();
    for (const [pid, v] of bestByProduct) {
      out.set(pid, { saleId: v.saleId, saleName: v.saleName, discountPct: v.discountPct });
    }
    return out;
  }

  // ── Admin ───────────────────────────────────────────────────────────

  listAll() {
    return this.prisma.sale.findMany({
      orderBy: [{ isActive: 'desc' }, { startsAt: 'desc' }],
      include: { _count: { select: { targets: true } } },
    });
  }

  async findById(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        targets: {
          include: {
            product: {
              select: {
                id: true, slug: true, sku: true, name: true, images: true,
                category: { select: { id: true, name: true, slug: true, pricingMode: true } },
              },
            },
          },
        },
      },
    });
    if (!sale) throw new NotFoundException(`Sale ${id} not found`);
    return sale;
  }

  async create(dto: CreateSaleDto) {
    this.assertDatesValid(dto.startsAt, dto.endsAt);
    try {
      return await this.prisma.sale.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          isActive: dto.isActive ?? true,
          bannerImageUrl: dto.bannerImageUrl,
          bannerLabel: dto.bannerLabel,
          ctaLabel: dto.ctaLabel,
          ctaHref: dto.ctaHref,
          showInBanner: dto.showInBanner ?? true,
          defaultDiscountPct: dto.defaultDiscountPct,
          maxDiscountPerCart: dto.maxDiscountPerCart,
        },
        include: { _count: { select: { targets: true } } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Sale slug already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateSaleDto) {
    await this.findById(id);
    if (dto.startsAt && dto.endsAt) this.assertDatesValid(dto.startsAt, dto.endsAt);
    try {
      return await this.prisma.sale.update({
        where: { id },
        data: {
          ...dto,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        },
        include: { _count: { select: { targets: true } } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Sale slug already exists');
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.sale.update({ where: { id }, data: { isActive: false } });
  }

  /** Replace the sale's product set with the provided list of targets (upserts). */
  async setTargets(saleId: string, dto: SetSaleTargetsDto) {
    await this.findById(saleId);

    // Validate all products exist + are active
    const productIds = dto.targets.map((t) => t.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('One or more productIds are invalid');
    }

    return this.prisma.$transaction(async (tx) => {
      // Wipe existing then re-insert (small volumes; simple).
      await tx.saleTarget.deleteMany({ where: { saleId } });
      if (dto.targets.length > 0) {
        await tx.saleTarget.createMany({
          data: dto.targets.map((t) => ({
            saleId,
            productId: t.productId,
            discountPctOverride: t.discountPctOverride ?? null,
          })),
        });
      }
      return tx.sale.findUnique({
        where: { id: saleId },
        include: { _count: { select: { targets: true } } },
      });
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private assertDatesValid(startsAt: string, endsAt: string) {
    const s = new Date(startsAt).getTime();
    const e = new Date(endsAt).getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) throw new BadRequestException('Invalid startsAt/endsAt');
    if (e <= s) throw new BadRequestException('endsAt must be after startsAt');
  }
}
