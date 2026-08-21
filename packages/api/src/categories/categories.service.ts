import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { serializeProduct } from '../products/serializer';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public ──────────────────────────────────────────────────────────

  listActive() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async publicBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true },
      include: {
        products: {
          where: { isActive: true },
          orderBy: [{ isFresh: 'desc' }, { createdAt: 'desc' }],
          take: 60,
        },
      },
    });
    if (!category) throw new NotFoundException(`Category "${slug}" not found`);
    const { products, ...rest } = category;
    return {
      ...rest,
      products: products.map((p) => serializeProduct(p, category.pricingMode)),
    };
  }

  // ── Admin ───────────────────────────────────────────────────────────

  listAll() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Category slug already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);
    try {
      return await this.prisma.category.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Category slug already exists');
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.findById(id);
    // Soft delete — flip isActive rather than hard-delete (protects historical order lines).
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }
}
