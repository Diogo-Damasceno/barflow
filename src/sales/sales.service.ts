import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { AuditService } from '../shared/audit.service';
import { CreateSaleDto } from './dto/sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  /** Cria venda: transação atualiza estoque (saída), registra movimento e auditoria. */
  async create(dto: CreateSaleDto, tenantId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      let costTotal = 0;
      let itemsData: any[] = [];

      for (const it of dto.items) {
        const product = await tx.product.findFirst({ where: { id: it.productId, tenantId } });
        if (!product) throw new NotFoundException(`produto ${it.productId} não encontrado`);
        if (product.quantity < it.quantity) {
          throw new BadRequestException(`estoque insuficiente: ${product.name}`);
        }
        // baixa de estoque
        await tx.product.update({
          where: { id: product.id },
          data: { quantity: product.quantity - it.quantity },
        });
        await tx.stockMovement.create({
          data: {
            tenantId, branchId: dto.branchId, productId: product.id,
            type: 'OUT', quantity: -it.quantity, reason: 'Venda', userId,
          },
        });
        costTotal += product.costPrice * it.quantity;
        itemsData.push({
          productId: product.id, name: product.name,
          quantity: it.quantity, unitPrice: product.salePrice,
          costPrice: product.costPrice, tenantId,
        });
      }

      const gross = itemsData.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const discount = dto.discount ?? 0;
      const addition = dto.addition ?? 0;
      const total = gross - discount + addition;
      const profit = total - costTotal;
      const change = (dto.amountReceived ?? total) > total ? (dto.amountReceived ?? 0) - total : 0;

      const sale = await tx.sale.create({
        data: {
          tenantId, branchId: dto.branchId, userId, customerName: dto.customerName,
          paymentMethod: dto.paymentMethod, discount, addition,
          amountReceived: dto.amountReceived ?? total, change,
          total, costTotal, profit, status: 'CLOSED',
          items: { create: itemsData },
        },
        include: { items: true },
      });

      await this.audit.log({
        tenantId, userId, action: 'SALE_CREATE', entity: 'Sale',
        entityId: sale.id, meta: { total, profit, paymentMethod: dto.paymentMethod },
      });
      return sale;
    });
  }

  async cancel(id: string, tenantId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({ where: { id, tenantId } });
      if (!sale) throw new NotFoundException('venda não encontrada');
      if (sale.status === 'CANCELLED') return sale;
      // estorna estoque
      const items = await tx.saleItem.findMany({ where: { saleId: id } });
      for (const it of items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { quantity: { increment: it.quantity } },
        });
      }
      const updated = await tx.sale.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: userId },
      });
      await this.audit.log({ tenantId, userId, action: 'SALE_CANCEL', entity: 'Sale', entityId: id });
      return updated;
    });
  }

  history(tenantId: string, filters: { from?: Date; to?: Date; userId?: string } = {}) {
    return this.prisma.sale.findMany({
      where: {
        tenantId, userId: filters.userId,
        createdAt: filters.from || filters.to
          ? { gte: filters.from, lte: filters.to }
          : undefined,
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
