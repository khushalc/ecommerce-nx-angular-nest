import { Body, Controller, DefaultValuePipe, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { ProductsService } from './products.service';
import { UploadsService } from './uploads.service';
import { CreateProductDto, UpdateProductDto, UploadUrlRequestDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.CATALOG_MANAGER)
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take?: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
  ) {
    return this.productsService.listAll({ search, categoryId, take, skip });
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
  }

  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  uploadUrl(@Body() dto: UploadUrlRequestDto) {
    return this.uploadsService.createPresignedUpload(dto);
  }
}
