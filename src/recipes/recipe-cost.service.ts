// Motor de custo de receitas — DOMAIN SERVICE PURO (sem Prisma, testável).
// Recebe ingredientes + preço de compra atual de cada produto e calcula:
// custo por ingrediente, custo total, lucro, margem, desperdício, rendimento.
// Percentuais (%) normalizam sobre o rendimento da receita.

export type Unit = 'UN' | 'ML' | 'L' | 'G' | 'KG' | 'PCT';

export interface CostIngredient {
  name: string;
  amount: number;
  unit: Unit;
  costPrice: number; // preço de compra por UNIDADE BASE do produto
  productUnit: Unit; // unidade base do produto (de onde veio o costPrice)
}

export interface RecipeCostResult {
  items: Array<{
    name: string;
    amount: number;
    unit: Unit;
    cost: number; // custo deste insumo na receita
  }>;
  rawCost: number; // soma dos insumos
  wasteCost: number; // rawCost * wastePct
  totalCost: number; // rawCost + wasteCost
  salePrice: number;
  profit: number; // salePrice - totalCost
  marginPct: number; // profit / salePrice * 100
}

/** Converte uma quantidade para a unidade base do produto (para custear). */
function toBase(amount: number, unit: Unit, productUnit: Unit): number {
  if (unit === 'PCT') return amount; // tratado separadamente (sobre rendimento)
  if (unit === 'UN' && productUnit === 'UN') return amount;
  if (unit === 'G' && productUnit === 'KG') return amount / 1000;
  if (unit === 'KG' && productUnit === 'G') return amount * 1000;
  if (unit === 'ML' && productUnit === 'L') return amount / 1000;
  if (unit === 'L' && productUnit === 'ML') return amount * 1000;
  // se a unidade bate com a base, 1:1; senão assume 1:1 (UN/UN ou mesma)
  return amount;
}

export class RecipeCostService {
  /**
   * @param ingredients insumos com preço de compra atual
   * @param yieldQty rendimento (ex.: 1 copo)
   * @param wastePct desperdício em % (0-100)
   * @param salePrice preço de venda da porção
   */
  calculate(
    ingredients: CostIngredient[],
    yieldQty: number,
    wastePct: number,
    salePrice: number,
  ): RecipeCostResult {
    const items: RecipeCostResult['items'] = [];
    let rawCost = 0;

    for (const ing of ingredients) {
      let qtyBase: number;
      if (ing.unit === 'PCT') {
        // % do rendimento: ex.: 25% de 1 copo de 500ml = 125ml.
        // Aqui amount% aplica-se sobre yieldQty na unidade base do produto.
        qtyBase = (ing.amount / 100) * (yieldQty || 1);
      } else {
        qtyBase = toBase(ing.amount, ing.unit, ing.productUnit);
      }
      const cost = qtyBase * ing.costPrice;
      rawCost += cost;
      items.push({ name: ing.name, amount: ing.amount, unit: ing.unit, cost });
    }

    const wasteCost = rawCost * (wastePct / 100);
    const totalCost = rawCost + wasteCost;
    const profit = salePrice - totalCost;
    const marginPct = salePrice > 0 ? (profit / salePrice) * 100 : 0;

    return {
      items,
      rawCost: round2(rawCost),
      wasteCost: round2(wasteCost),
      totalCost: round2(totalCost),
      salePrice: round2(salePrice),
      profit: round2(profit),
      marginPct: round2(marginPct),
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
