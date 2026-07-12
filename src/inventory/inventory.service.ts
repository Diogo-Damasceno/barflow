import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { MovementDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /** Registra movimentação e atualiza o saldo do produto numa transação. */
  async move(dto: MovementDto, tenantId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: dto.productId, tenantId } });
      if (!product) throw new NotFoundException('produto não encontrado');

      // ajuste: define saldo absoluto; demais: delta
      let delta = dto.quantity;
      if (dto.type === 'ADJUST') {
        delta = dto.quantity - product.quantity;
      }
      const nextQty = product.quantity + (dto.type === 'OUT' ? -Math.abs(delta) : delta);
      if (nextQty < 0) throw new BadRequestException('estoque insuficiente');

      await tx.product.update({ where: { id: product.id }, data: { quantity: nextQty } });

      const movement = await tx.stockMovement.create({
        data: {
          tenantId, branchId: dto.branchId, productId: dto.productId,
          type: dto.type, quantity: dto.type === 'OUT' ? -Math.abs(delta) : delta,
          reason: dto.reason, userId,
        },
      });
      return movement;
    });
  }

  history(tenantId: string, productId?: string) {
    return this.prisma.stockMovement.findMany({
      where: { tenantId, productId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  /** Produtos abaixo do estoque mínimo. */
  async lowStock(tenantId: string) {
    const products = await this.prisma.product.findMany({ where: { tenantId } });
    return products
      .filter((p) => p.quantity <= p.minStock)
      .map((p) => ({ id: p.id, name: p.name, quantity: p.quantity, minStock: p.minStock }));
  }
}
