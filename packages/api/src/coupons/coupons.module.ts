import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { AdminCouponsController } from './admin-coupons.controller';
import { PublicCouponsController } from './public-coupons.controller';

@Module({
  controllers: [AdminCouponsController, PublicCouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
