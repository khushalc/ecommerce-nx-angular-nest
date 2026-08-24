import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PricingMode, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SalesService } from '../sales/sales.service';
import {
  BulkCategoryDto,
  BulkDiscountDto,
  BulkFlagDto,
  BulkIdsDto,
  BulkResult,
  CreateProductDto,
  UpdateProductDto,
} from './dto';
import { serializeProduct } from './serializer';

type ProductWithCategory = Product & {
  category: { id: string; slug: string; name: string; pricingMode: PricingMode };
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesService: SalesService,
  ) {}

  private async serializeMany(items: ProductWithCategory[]) {
    const activeMap = await this.salesService.getActiveDiscountsForProducts(items.map((p) => p.id));
    return items.map((p) => serializeProduct(p, undefined, activeMap.get(p.id) ?? null));
  }

  private async serializeOne(p: ProductWithCategory) {
    const active = await this.salesService.getActiveDiscountForProduct(p.id);
    return serializeProduct(p, undefined, active);
  }

  // ── Public ──────────────────────────────────────────────────────────

  async listPublic(opts: { categorySlug?: string; fresh?: boolean; take?: number; skip?: number }) {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(opts.categorySlug ? { category: { slug: opts.categorySlug, isActive: true } } : {}),
      ...(opts.fresh ? { isFresh: true } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: { select: { id: true, slug: true, name: true, pricingMode: true } } },
        orderBy: [{ isFresh: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(opts.take ?? 24, 60),
        skip: opts.skip ?? 0,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: await this.serializeMany(items as ProductWithCategory[]), total };
  }

  async publicBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { category: { select: { id: true, slug: true, name: true, pricingMode: true } } },
    });
    if (!product) throw new NotFoundException(`Product "${slug}" not found`);
    return this.serializeOne(product as ProductWithCategory);
  }

  // ── Admin ───────────────────────────────────────────────────────────

  async listAll(opts: { search?: string; categoryId?: string; take?: number; skip?: number }) {
    const where: Prisma.ProductWhereInput = {
      ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(opts.search
        ? {
            OR: [
              { name: { contains: opts.search, mode: 'insensitive' } },
              { sku: { contains: opts.search, mode: 'insensitive' } },
              { slug: { contains: opts.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: { select: { id: true, slug: true, name: true, pricingMode: true } } },
        orderBy: [{ updatedAt: 'desc' }],
        take: Math.min(opts.take ?? 50, 100),
        skip: opts.skip ?? 0,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items: await this.serializeMany(items as ProductWithCategory[]), total };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, slug: true, name: true, pricingMode: true } } },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return this.serializeOne(product as ProductWithCategory);
  }

  async create(dto: CreateProductDto) {
    await this.assertCategoryIsLeaf(dto.categoryId);
    this.assertPricingFieldsPresent(dto);

    try {
      const created = await this.prisma.product.create({
        data: { ...dto, images: dto.images ?? [] },
        include: { category: { select: { id: true, slug: true, name: true, pricingMode: true } } },
      });
      return this.serializeOne(created as ProductWithCategory);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Duplicate slug or SKU');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);
    if (dto.categoryId) await this.assertCategoryIsLeaf(dto.categoryId);

    try {
      const updated = await this.prisma.product.update({
        where: { id },
        data: dto,
        include: { category: { select: { id: true, slug: true, name: true, pricingMode: true } } },
      });
      return this.serializeOne(updated as ProductWithCategory);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Duplicate slug or SKU');
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  // ── Bulk actions ────────────────────────────────────────────────────

  async bulkSetDiscount(dto: BulkDiscountDto): Promise<BulkResult> {
    const res = await this.prisma.product.updateMany({
      where: { id: { in: dto.productIds } },
      data: { specialDiscount: dto.pct },
    });
    return { updated: res.count };
  }

  async bulkClearDiscount(dto: BulkIdsDto): Promise<BulkResult> {
    const res = await this.prisma.product.updateMany({
      where: { id: { in: dto.productIds } },
      data: { specialDiscount: 0 },
    });
    return { updated: res.count };
  }

  async bulkSetFresh(dto: BulkFlagDto): Promise<BulkResult> {
    const res = await this.prisma.product.updateMany({
      where: { id: { in: dto.productIds } },
      data: { isFresh: dto.value },
    });
    return { updated: res.count };
  }

  async bulkSetActive(dto: BulkFlagDto): Promise<BulkResult> {
    const res = await this.prisma.product.updateMany({
      where: { id: { in: dto.productIds } },
      data: { isActive: dto.value },
    });
    return { updated: res.count };
  }

  async bulkChangeCategory(dto: BulkCategoryDto): Promise<BulkResult> {
    // Guard: destination must be a leaf category
    await this.assertCategoryIsLeaf(dto.categoryId);
    const res = await this.prisma.product.updateMany({
      where: { id: { in: dto.productIds } },
      data: { categoryId: dto.categoryId },
    });
    return { updated: res.count };
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private async assertCategoryIsLeaf(categoryId: string) {
    const c = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { children: true } } },
    });
    if (!c) throw new NotFoundException(`Category ${categoryId} not found`);
    if (c._count.children > 0) {
      throw new BadRequestException(
        `Category "${c.name}" has sub-categories — products must be assigned to a leaf sub-category.`,
      );
    }
    return c;
  }

  private assertPricingFieldsPresent(dto: CreateProductDto) {
    const hasMrp = dto.mrp != null;
    const hasLive = dto.metal && dto.purity && dto.weightGrams != null;
    if (!hasMrp && !hasLive) {
      throw new BadRequestException('Provide either mrp (FIXED_MRP) or metal+purity+weightGrams (LIVE_METAL_RATE)');
    }
  }
}
