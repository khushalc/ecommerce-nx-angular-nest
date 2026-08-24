import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { serializeProduct } from '../products/serializer';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public ──────────────────────────────────────────────────────────

  /** Root categories only (nav / home grid). */
  listActive() {
    return this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  /**
   * Public category page.
   *   - Root with children → returns children[] + empty products[] (drill down).
   *   - Leaf → returns children[] (empty) + products[] (serialized).
   */
  async publicBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true },
      include: {
        parent: { select: { id: true, slug: true, name: true } },
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
        products: {
          where: { isActive: true },
          orderBy: [{ isFresh: 'desc' }, { createdAt: 'desc' }],
          take: 60,
        },
      },
    });
    if (!category) throw new NotFoundException(`Category "${slug}" not found`);

    const { products, children, ...rest } = category;
    // Products only make sense on a leaf. Suppress them on a root-with-children.
    const isLeaf = children.length === 0;
    return {
      ...rest,
      children,
      products: isLeaf ? products.map((p) => serializeProduct(p, category.pricingMode)) : [],
      isLeaf,
    };
  }

  // ── Admin ───────────────────────────────────────────────────────────

  /** Full tree for the admin — flat list with parent info + counts. */
  listAll() {
    return this.prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { id: true, slug: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, slug: true, name: true } },
        children: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        _count: { select: { products: true, children: true } },
      },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const effectiveMode = await this.resolvePricingMode(dto.parentId, dto.pricingMode);

    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          pricingMode: effectiveMode,
          parentId: dto.parentId ?? null,
          heroImageUrl: dto.heroImageUrl,
          sortOrder: dto.sortOrder ?? 0,
          isActive: dto.isActive ?? true,
        },
        include: { parent: { select: { id: true, slug: true, name: true } } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Category slug already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const current = await this.findById(id);
    const nextParentId = dto.parentId === undefined ? current.parentId : dto.parentId;
    const nextPricingMode = await this.resolvePricingMode(nextParentId ?? undefined, dto.pricingMode ?? current.pricingMode);

    // Prevent turning a root-with-children into a child (would create 3-level tree).
    if (dto.parentId && current._count.children > 0) {
      throw new BadRequestException('Cannot make this a sub-category: it already has children of its own');
    }
    // Prevent making a category its own parent
    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          pricingMode: nextPricingMode,
          parentId: nextParentId,
          heroImageUrl: dto.heroImageUrl,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
        include: { parent: { select: { id: true, slug: true, name: true } } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Category slug already exists');
      }
      throw e;
    }
  }

  async remove(id: string) {
    const current = await this.findById(id);
    const activeChildren = await this.prisma.category.count({ where: { parentId: id, isActive: true } });
    if (activeChildren > 0) {
      throw new BadRequestException('Deactivate all sub-categories first');
    }
    // Soft-delete only (preserves historical order lines & product refs)
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  /**
   * If parentId is set, validate it (2-level cap) and return the parent's pricingMode.
   * Otherwise return dtoMode (required for root categories).
   */
  private async resolvePricingMode(parentId: string | undefined, dtoMode: string | undefined) {
    if (!parentId) {
      if (!dtoMode) {
        throw new BadRequestException('pricingMode is required for root categories');
      }
      return dtoMode as any;
    }

    const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) throw new NotFoundException(`Parent category ${parentId} not found`);
    if (parent.parentId !== null) {
      throw new BadRequestException('2-level cap: parent must be a root category (no grand-children)');
    }
    return parent.pricingMode;
  }
}
