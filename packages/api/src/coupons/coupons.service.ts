import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CouponValidationResult, CreateCouponDto, UpdateCouponDto } from './dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Admin ───────────────────────────────────────────────────────────

  listAll() {
    return this.prisma.coupon.findMany({
      orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
    });
  }

  async findById(id: string) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c) throw new NotFoundException(`Coupon ${id} not found`);
    return c;
  }

  async create(dto: CreateCouponDto) {
    try {
      return await this.prisma.coupon.create({
        data: {
          ...dto,
          code: dto.code.toUpperCase(),
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Coupon code already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findById(id);
    try {
      return await this.prisma.coupon.update({
        where: { id },
        data: {
          ...dto,
          code: dto.code ? dto.code.toUpperCase() : undefined,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Coupon code already exists');
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }

  // ── Public — validate a coupon against a cart value ─────────────────

  async validate(code: string, cartValue: number, now = new Date()): Promise<CouponValidationResult> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) return { valid: false, message: 'Invalid code' };
    if (!coupon.isActive) return { valid: false, message: 'This coupon is disabled' };
    if (coupon.startsAt && coupon.startsAt > now) return { valid: false, message: `Starts on ${coupon.startsAt.toDateString()}` };
    if (coupon.endsAt && coupon.endsAt < now) return { valid: false, message: 'Coupon has expired' };
    if (coupon.totalUsageCap && coupon.totalUsageCount >= coupon.totalUsageCap) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }
    const minCart = coupon.minCartValue ? Number(coupon.minCartValue) : 0;
    if (cartValue < minCart) {
      return { valid: false, message: `Requires cart value ≥ ₹${minCart.toLocaleString('en-IN')}` };
    }

    // Compute discount
    let discount = 0;
    const value = Number(coupon.discountValue);
    if (coupon.discountType === 'PERCENT') {
      discount = Math.round((cartValue * value) / 100);
    } else {
      discount = Math.min(Math.round(value), Math.round(cartValue));
    }
    if (coupon.maxDiscount) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }

    return {
      valid: true,
      code: coupon.code,
      discount,
      message: `${coupon.code} applied — ₹${discount.toLocaleString('en-IN')} off`,
    };
  }
}
