import { RecipeCostService } from '../../src/recipes/recipe-cost.service';

describe('RecipeCostService (domínio puro)', () => {
  const svc = new RecipeCostService();

  it('calcula custo de receita com ml/g/kg corretamente', () => {
    // Whisky 0.50/ml (UN base ML), Energético 0.20/ml
    const r = svc.calculate(
      [
        { name: 'Whisky', amount: 125, unit: 'ML', costPrice: 0.5, productUnit: 'ML' },
        { name: 'Energético', amount: 325, unit: 'ML', costPrice: 0.2, productUnit: 'ML' },
      ],
      500, 5, 18, // rendimento 500ml, desperdício 5%, venda 18
    );
    // raw = 125*0.5 + 325*0.2 = 62.5 + 65 = 127.5
    expect(r.rawCost).toBe(127.5);
    expect(r.wasteCost).toBeCloseTo(6.375, 2);
    expect(r.totalCost).toBeCloseTo(133.875, 2);
    expect(r.profit).toBeCloseTo(18 - 133.875, 2);
    expect(r.marginPct).toBeCloseTo(((18 - 133.875) / 18) * 100, 2);
  });

  it('normaliza % sobre o rendimento (ex.: 25% de 500ml = 125ml)', () => {
    const r = svc.calculate(
      [{ name: 'Whisky', amount: 25, unit: 'PCT', costPrice: 0.5, productUnit: 'ML' }],
      500, 0, 10,
    );
    // 25% de 500ml = 125ml * 0.5 = 62.5
    expect(r.items[0].cost).toBeCloseTo(62.5, 2);
    expect(r.totalCost).toBeCloseTo(62.5, 2);
  });

  it('converte kg->g e L->ml na base do produto', () => {
    // produto base KG, insumo 0.1 KG = 100g; custo 10/kg -> 1.0
    const kg = svc.calculate(
      [{ name: 'Açúcar', amount: 0.1, unit: 'KG', costPrice: 10, productUnit: 'KG' }],
      1, 0, 5,
    );
    expect(kg.totalCost).toBeCloseTo(1, 2);

    // produto base L, insumo 0.05 L = 50ml; custo 8/L -> 0.4
    const lit = svc.calculate(
      [{ name: 'Água', amount: 0.05, unit: 'L', costPrice: 8, productUnit: 'L' }],
      1, 0, 5,
    );
    expect(lit.totalCost).toBeCloseTo(0.4, 2);
  });

  it('lucro negativo gera margem negativa (sem quebrar)', () => {
    const r = svc.calculate(
      [{ name: 'X', amount: 100, unit: 'ML', costPrice: 5, productUnit: 'ML' }],
      100, 0, 2, // custo 500, venda 2
    );
    expect(r.profit).toBeLessThan(0);
    expect(r.marginPct).toBeLessThan(0);
  });
});
