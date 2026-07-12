import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async salesRows(tenantId: string, from?: Date, to?: Date) {
    const where: any = { tenantId, status: 'CLOSED' };
    if (from || to) where.createdAt = { gte: from, lte: to };
    const sales = await this.prisma.sale.findMany({
      where, include: { items: true }, orderBy: { createdAt: 'desc' },
    });
    return sales.map((s) => ({
      id: s.id,
      data: s.createdAt.toISOString().slice(0, 10),
      pagamento: s.paymentMethod,
      itens: s.items.reduce((n, i) => n + i.quantity, 0),
      total: s.total,
      custo: s.costTotal,
      lucro: s.profit,
    }));
  }

  toCSV(rows: any[]): string {
    if (!rows.length) return '';
    const cols = Object.keys(rows[0]);
    const head = cols.join(',');
    const body = rows.map((r) =>
      cols.map((c) => {
        const v = String(r[c] ?? '').replace(/"/g, '""');
        return /[",\n]/.test(v) ? `"${v}"` : v;
      }).join(','),
    );
    return [head, ...body].join('\n');
  }

  async toXLSX(rows: any[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Vendas');
    if (rows.length) ws.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k }));
    rows.forEach((r) => ws.addRow(r));
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async toPDF(rows: any[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(16).text('Relatório de Vendas — BarFlow', { align: 'center' });
      doc.moveDown();
      if (rows.length) {
        const cols = Object.keys(rows[0]);
        doc.fontSize(9);
        rows.slice(0, 40).forEach((r, i) => {
          doc.text(`${i + 1}. ${r.data} | ${r.pagamento} | total ${r.total} | lucro ${r.lucro}`);
        });
      } else {
        doc.text('Sem dados no período.');
      }
      doc.end();
    });
  }
}
