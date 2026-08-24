import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SalesService } from './sales.service';

@SkipThrottle()   // called on every page load; not sensitive to abuse
@Controller('public/announcements')
export class PublicAnnouncementsController {
  constructor(private readonly salesService: SalesService) {}

  @Get('active')
  active() {
    return this.salesService.getActiveBanner();
  }
}
