import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, PermissionsGuard } from '../shared/guards';
import { Require } from '../shared/permissions.decorator';
import { User, AuthUser } from '../shared/user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Require('report:read')
  @Get('kpis')
  kpis(@User() u: AuthUser) {
    return this.dashboard.kpis(u.tenantId);
  }

  @Require('report:read')
  @Get('series')
  series(@User() u: AuthUser, @Query('days') days?: string) {
    return this.dashboard.series(u.tenantId, days ? Number(days) : 30);
  }
}
