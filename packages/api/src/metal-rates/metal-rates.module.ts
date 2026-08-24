import { Global, Module } from '@nestjs/common';
import { MetalRatesService } from './metal-rates.service';
import { AdminMetalRatesController } from './admin-metal-rates.controller';
import { PublicMetalRatesController } from './public-metal-rates.controller';

@Global()
@Module({
  controllers: [AdminMetalRatesController, PublicMetalRatesController],
  providers: [MetalRatesService],
  exports: [MetalRatesService],
})
export class MetalRatesModule {}
