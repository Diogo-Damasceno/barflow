import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreateProductDto, UpdateProductPriceDto, CreateSupplierDto, CreateCategoryDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async create(dto: CreateProductDto, tenantId: string, actorId: string) {
    const product = await this.prisma.product.create({
      data: {
        tenantId, code: dto.code, name: dto.name, barcode: dto.barcode,
        description: dto.description, categoryId: dto.categoryId,
        supplierId: dto.supplierId, unit: dto.unit ?? 'UN',
        quantity: dto.quantity ?? 0, minStock: dto.minStock ?? 0,
        costPrice: dto.costPrice, salePrice: dto.salePrice,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        notes: dto.notes, imageUrl: dto.imageUrl,
      },
    });
    await this.audit.log({
      tenantId, userId: actorId, action: 'PRODUCT_CREATE',
      entity: 'Product', entityId: product.id,
    });
    return product;
  }

  /** Alteração de preço — dispara recálculo de receitas que usam o produto. */
  async updatePrice(id: string, dto: UpdateProductPriceDto, tenantId: string, actorId: string) {
    const product = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!product) throw new NotFoundException('produto não encontrado');
    const updated = await this.prisma.product.update({
      where: { id },
      data: { costPrice: dto.costPrice, salePrice: dto.salePrice },
    });
    await this.audit.log({
      tenantId, userId: actorId, action: 'PRICE_UPDATE',
      entity: 'Product', entityId: id,
      meta: { costPrice: dto.costPrice, salePrice: dto.salePrice },
    });
    return updated;
  }

  list(tenantId: string, filters: { categoryId?: string; q?: string } = {}) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        categoryId: filters.categoryId,
        OR: filters.q
          ? [
              { name: { contains: filters.q, mode: 'insensitive' } },
              { code: { contains: filters.q } },
              { barcode: filters.q },
            ]
          : undefined,
      },
      include: { category: true, supplier: true },
      orderBy: { name: 'asc' },
    });
  }

  // --- Fornecedores / Categorias ---
  async createSupplier(dto: CreateSupplierDto, tenantId: string) {
    return this.prisma.supplier.create({ data: { tenantId, ...dto } });
  }
  async createCategory(dto: CreateCategoryDto, tenantId: string) {
    return this.prisma.category.create({ data: { tenantId, ...dto } });
  }
}
