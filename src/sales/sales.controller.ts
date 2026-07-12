import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/sale.dto';
import { JwtAuthGuard, PermissionsGuard } from '../shared/guards';
import { Require } from '../shared/permissions.decorator';
import { User, AuthUser } from '../shared/user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales')
export class SalesController {
  constructor(private sales: SalesService) {}

  @Require('sale:create')
  @Post()
  create(@Body() dto: CreateSaleDto, @User() u: AuthUser) {
    return this.sales.create(dto, u.tenantId, u.id);
  }

  @Require('sale:cancel')
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @User() u: AuthUser) {
    return this.sales.cancel(id, u.tenantId, u.id);
  }

  @Require('sale:read')
  @Get()
  history(
    @User() u: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
  ) {
    return this.sales.history(u.tenantId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      userId,
    });
  }
}
