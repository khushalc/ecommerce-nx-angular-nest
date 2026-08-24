import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { SalesService } from './sales.service';
import { CreateSaleDto, SetSaleTargetsDto, UpdateSaleDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('admin/sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.CATALOG_MANAGER)
export class AdminSalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get() list() { return this.salesService.listAll(); }

  @Get(':id') byId(@Param('id') id: string) { return this.salesService.findById(id); }

  @Post() create(@Body() dto: CreateSaleDto) { return this.salesService.create(dto); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateSaleDto) {
    return this.salesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.salesService.remove(id);
  }

  @Put(':id/targets')
  setTargets(@Param('id') id: string, @Body() dto: SetSaleTargetsDto) {
    return this.salesService.setTargets(id, dto);
  }
}
