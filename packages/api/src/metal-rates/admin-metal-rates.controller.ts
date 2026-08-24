import { Body, Controller, DefaultValuePipe, Get, HttpCode, HttpStatus, ParseIntPipe, Put, Query, UseGuards } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { MetalRatesService } from './metal-rates.service';
import { UpsertRatesDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('admin/metal-rates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.CATALOG_MANAGER)
export class AdminMetalRatesController {
  constructor(private readonly service: MetalRatesService) {}

  @Get()
  list(@Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number) {
    return this.service.listRecent(limit);
  }

  @Get('today')
  today() {
    return this.service.getToday();
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  upsert(@Body() dto: UpsertRatesDto) {
    return this.service.upsertBatch(dto);
  }
}
