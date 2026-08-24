import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.CATALOG_MANAGER)
export class AdminCouponsController {
  constructor(private readonly service: CouponsService) {}

  @Get() list() { return this.service.listAll(); }

  @Get(':id') byId(@Param('id') id: string) { return this.service.findById(id); }

  @Post() create(@Body() dto: CreateCouponDto) { return this.service.create(dto); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
