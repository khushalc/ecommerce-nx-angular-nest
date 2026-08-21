import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PricingMode, Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { serializeProduct } from './serializer';

type ProductWithCategory = Product & {
  category: { id: string; slug: string; name: string; pricingMode: PricingMode };
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(p: ProductWithCategory) {
    return serializeProduct(p);
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

    return { items: items.map((p) => this.serialize(p as ProductWithCategory)), total };
  }

  async publicBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { category: { select: { id: true, slug: true, name: true, pricingMode: true } } },
    });
    if (!product) throw new NotFoundException(`Product "${slug}" not found`);
    return this.serialize(product as ProductWithCategory);
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
    return { items: items.map((p) => this.serialize(p as ProductWithCategory)), total };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, slug: true, name: true, pricingMode: true } } },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return this.serialize(product as ProductWithCategory);
  }

  async create(dto: CreateProductDto) {
    await this.assertCategoryExists(dto.categoryId);
    this.assertPricingFieldsPresent(dto);

    try {
      const created = await this.prisma.product.create({
        data: {
          ...dto,
          images: dto.images ?? [],
        },
        include: { category: { select: { id: true, slug: true, name: true, pricingMode: true } } },
      });
      return this.serialize(created as ProductWithCategory);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Duplicate slug or SKU');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);
    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);

    try {
      const updated = await this.prisma.product.update({
        where: { id },
        data: dto,
        include: { category: { select: { id: true, slug: true, name: true, pricingMode: true } } },
      });
      return this.serialize(updated as ProductWithCategory);
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

  // ── Helpers ─────────────────────────────────────────────────────────

  private async assertCategoryExists(categoryId: string) {
    const c = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!c) throw new NotFoundException(`Category ${categoryId} not found`);
    return c;
  }

  private assertPricingFieldsPresent(dto: CreateProductDto) {
    // Enforced only when caller provides mode via categoryId's pricingMode is authoritative,
    // but we still sanity-check that mrp OR live-metal fields are set.
    const hasMrp = dto.mrp != null;
    const hasLive = dto.metal && dto.purity && dto.weightGrams != null;
    if (!hasMrp && !hasLive) {
      throw new BadRequestException('Provide either mrp (FIXED_MRP) or metal+purity+weightGrams (LIVE_METAL_RATE)');
    }
  }
}
