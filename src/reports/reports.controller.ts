import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard, PermissionsGuard } from '../shared/guards';
import { Require } from '../shared/permissions.decorator';
import { User, AuthUser } from '../shared/user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Require('report:export')
  @Get('sales')
  async sales(
    @User() u: AuthUser,
    @Query('format') format: 'csv' | 'xlsx' | 'pdf' = 'csv',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const rows = await this.reports.salesRows(
      u.tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
    if (format === 'csv') {
      const csv = this.reports.toCSV(rows);
      res?.header('Content-Type', 'text/csv');
      res?.header('Content-Disposition', 'attachment; filename=vendas.csv');
      return res?.send(csv);
    }
    if (format === 'xlsx') {
      const buf = await this.reports.toXLSX(rows);
      res?.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res?.header('Content-Disposition', 'attachment; filename=vendas.xlsx');
      return res?.send(buf);
    }
    const buf = await this.reports.toPDF(rows);
    res?.header('Content-Type', 'application/pdf');
    res?.header('Content-Disposition', 'attachment; filename=vendas.pdf');
    return res?.send(buf);
  }
}
