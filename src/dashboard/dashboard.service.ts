import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async kpis(tenantId: string) {
    const now = new Date();
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(day.getTime() - 6 * 864e5); // últimos 7 dias
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const year = new Date(now.getFullYear(), 0, 1);

    const run = (from: Date) =>
      this.prisma.sale.aggregate({
        where: { tenantId, status: 'CLOSED', createdAt: { gte: from } },
        _sum: { total: true, costTotal: true, profit: true },
        _count: { _all: true },
      });

    const [d, w, m, y] = await Promise.all([run(day), run(week), run(month), run(year)]);

    const ticket = (a: any) => (a._count._all ? (a._sum.total || 0) / a._count._all : 0);

    // produtos mais vendidos (mês)
    const top = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: { tenantId, sale: { createdAt: { gte: month }, status: 'CLOSED' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });
    const topNames = await Promise.all(
      top.map(async (t) => {
        const p = await this.prisma.product.findUnique({ where: { id: t.productId } });
        return { name: p?.name ?? t.productId, qty: t._sum.quantity };
      }),
    );

    // funcionários com mais vendas (mês)
    const byEmp = await this.prisma.sale.groupBy({
      by: ['userId'],
      where: { tenantId, createdAt: { gte: month }, status: 'CLOSED' },
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    });
    const empNames = await Promise.all(
      byEmp.map(async (e) => {
        const u = await this.prisma.user.findUnique({ where: { id: e.userId } });
        return { name: u?.name ?? e.userId, total: e._sum.total, sales: e._count._all };
      }),
    );

    const lowStock = await this.prisma.product.count({
      where: { tenantId, quantity: { lte: this.prisma.product.fields.minStock } },
    });

    return {
      faturamento: {
        hoje: d._sum.total || 0, semana: w._sum.total || 0,
        mes: m._sum.total || 0, ano: y._sum.total || 0,
      },
      lucro: {
        hoje: d._sum.profit || 0, semana: w._sum.profit || 0,
        mes: m._sum.profit || 0, ano: y._sum.profit || 0,
      },
      custos: { mes: m._sum.costTotal || 0 },
      ticketMedio: ticket(m),
      totalPedidos: m._count._all,
      produtosMaisVendidos: topNames,
      funcionariosTop: empNames,
      estoqueBaixo: lowStock,
    };
  }

  /** Série diária (últimos 30 dias) para gráfico de linha/área. */
  async series(tenantId: string, days = 30) {
    const from = new Date(Date.now() - (days - 1) * 864e5);
    const sales = await this.prisma.sale.findMany({
      where: { tenantId, status: 'CLOSED', createdAt: { gte: from } },
      select: { createdAt: true, total: true, profit: true },
    });
    const map: Record<string, { date: string; total: number; profit: number }> = {};
    for (let i = 0; i < days; i++) {
      const dt = new Date(from.getTime() + i * 864e5);
      const key = dt.toISOString().slice(0, 10);
      map[key] = { date: key, total: 0, profit: 0 };
    }
    for (const s of sales) {
      const key = s.createdAt.toISOString().slice(0, 10);
      if (map[key]) {
        map[key].total += s.total;
        map[key].profit += s.profit;
      }
    }
    return Object.values(map);
  }
}
