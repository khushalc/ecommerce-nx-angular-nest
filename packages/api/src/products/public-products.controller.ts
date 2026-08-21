import { Controller, DefaultValuePipe, Get, Param, ParseBoolPipe, ParseIntPipe, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(
    @Query('category') categorySlug?: string,
    @Query('fresh', new DefaultValuePipe(false), ParseBoolPipe) fresh?: boolean,
    @Query('take', new DefaultValuePipe(24), ParseIntPipe) take?: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
  ) {
    return this.productsService.listPublic({ categorySlug, fresh, take, skip });
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.productsService.publicBySlug(slug);
  }
}
