import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { UploadsService } from './uploads.service';
import { PublicProductsController } from './public-products.controller';
import { AdminProductsController } from './admin-products.controller';

@Module({
  controllers: [PublicProductsController, AdminProductsController],
  providers: [ProductsService, UploadsService],
  exports: [ProductsService],
})
export class ProductsModule {}
