import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('public/categories')
export class PublicCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list() {
    return this.categoriesService.listActive();
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.categoriesService.publicBySlug(slug);
  }
}
