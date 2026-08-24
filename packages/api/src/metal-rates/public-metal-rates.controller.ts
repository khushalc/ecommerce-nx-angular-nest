import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { MetalRatesService } from './metal-rates.service';

@SkipThrottle()
@Controller('public/metal-rates')
export class PublicMetalRatesController {
  constructor(private readonly service: MetalRatesService) {}

  @Get('today')
  today() {
    return this.service.getToday();
  }
}
