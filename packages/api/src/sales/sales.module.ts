import { Global, Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { AdminSalesController } from './admin-sales.controller';
import { PublicAnnouncementsController } from './public-announcements.controller';

@Global()
@Module({
  controllers: [AdminSalesController, PublicAnnouncementsController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
