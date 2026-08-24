import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto';

@Controller('public/coupons')
export class PublicCouponsController {
  constructor(private readonly service: CouponsService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidateCouponDto) {
    return this.service.validate(dto.code, dto.cartValue);
  }
}
