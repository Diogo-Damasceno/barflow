import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { RecipeCostService, CostIngredient } from './recipe-cost.service';
import { CreateRecipeDto } from './dto/recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcula custo usando os preços de compra ATUAIS dos produtos.
   * Ao alterar o preço de um produto, basta refazer este cálculo (sob demanda)
   * — não guardamos custo stale nas receitas.
   */
  async cost(recipeId: string, tenantId: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, tenantId },
      include: { items: { include: { product: true } } },
    });
    if (!recipe) throw new NotFoundException('receita não encontrada');
    return this._compute(recipe);
  }

  /** Recalcula todas as receitas que usam um dado produto (após mudança de preço). */
  async recomputeForProduct(productId: string) {
    const items = await this.prisma.recipeItem.findMany({
      where: { productId },
      select: { recipeId: true },
      distinct: ['recipeId'],
    });
    for (const it of items) {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id: it.recipeId },
        include: { items: { include: { product: true } } },
      });
      if (recipe) this._compute(recipe); // recálculo (poderia cachear em Redis)
    }
    return { recomputed: items.length };
  }

  async create(dto: CreateRecipeDto, tenantId: string) {
    return this.prisma.recipe.create({
      data: {
        tenantId, name: dto.name, description: dto.description,
        yield: dto.yield ?? 1, yieldUnit: dto.yieldUnit ?? 'UN',
        wastePct: dto.wastePct ?? 0, salePrice: dto.salePrice,
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId, amount: i.amount, unit: i.unit,
          })),
        },
      },
      include: { items: true },
    });
  }

  list(tenantId: string) {
    return this.prisma.recipe.findMany({
      where: { tenantId },
      include: { items: { include: { product: true } } },
      orderBy: { name: 'asc' },
    });
  }

  private _compute(recipe: any) {
    const ingredients: CostIngredient[] = recipe.items.map((it: any) => ({
      name: it.product.name,
      amount: it.amount,
      unit: it.unit,
      costPrice: it.product.costPrice,
      productUnit: it.product.unit,
    }));
    const result = new RecipeCostService().calculate(
      ingredients, recipe.yield, recipe.wastePct, recipe.salePrice,
    );
    return { recipe: { id: recipe.id, name: recipe.name, yield: recipe.yield, wastePct: recipe.wastePct }, cost: result };
  }
}
