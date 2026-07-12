import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductPriceDto, CreateSupplierDto, CreateCategoryDto } from './dto/product.dto';
import { JwtAuthGuard, PermissionsGuard } from '../shared/guards';
import { Require } from '../shared/permissions.decorator';
import { User, AuthUser } from '../shared/user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Require('product:create')
  @Post()
  create(@Body() dto: CreateProductDto, @User() u: AuthUser) {
    return this.products.create(dto, u.tenantId, u.id);
  }

  @Require('product:read')
  @Get()
  list(@User() u: AuthUser, @Query('categoryId') categoryId?: string, @Query('q') q?: string) {
    return this.products.list(u.tenantId, { categoryId, q });
  }

  @Require('product:update')
  @Put(':id/price')
  updatePrice(@Param('id') id: string, @Body() dto: UpdateProductPriceDto, @User() u: AuthUser) {
    return this.products.updatePrice(id, dto, u.tenantId, u.id);
  }

  @Require('supplier:create')
  @Post('suppliers')
  supplier(@Body() dto: CreateSupplierDto, @User() u: AuthUser) {
    return this.products.createSupplier(dto, u.tenantId);
  }

  @Require('category:create')
  @Post('categories')
  category(@Body() dto: CreateCategoryDto, @User() u: AuthUser) {
    return this.products.createCategory(dto, u.tenantId);
  }
}
