import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return { status: 'ok', uptime: process.uptime(), ts: Date.now() };
  }

  @Get()
  root() {
    return this.appService.getData();
  }
}
