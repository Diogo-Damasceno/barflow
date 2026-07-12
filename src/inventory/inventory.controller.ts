import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { MovementDto } from './dto/inventory.dto';
import { JwtAuthGuard, PermissionsGuard } from '../shared/guards';
import { Require } from '../shared/permissions.decorator';
import { User, AuthUser } from '../shared/user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Require('inventory:write')
  @Post('movements')
  move(@Body() dto: MovementDto, @User() u: AuthUser) {
    return this.inventory.move(dto, u.tenantId, u.id);
  }

  @Require('inventory:read')
  @Get('movements')
  history(@User() u: AuthUser, @Query('productId') productId?: string) {
    return this.inventory.history(u.tenantId, productId);
  }

  @Require('inventory:read')
  @Get('low-stock')
  low(@User() u: AuthUser) {
    return this.inventory.lowStock(u.tenantId);
  }
}
