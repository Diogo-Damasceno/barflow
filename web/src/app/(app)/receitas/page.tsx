'use client';

import { useEffect, useState } from 'react';
import { getRecipes, getRecipeCost, ApiError, type Recipe, type RecipeCost } from '@/lib/api';
import { brl, num, pct } from '@/lib/format';
import { Card } from '@/components/ui';

export default function ReceitasPage() {
  const [items, setItems] = useState<Recipe[]>([]);
  const [err, setErr] = useState('');
  const [sel, setSel] = useState<RecipeCost | null>(null);
  const [loadingCost, setLoadingCost] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getRecipes();
        setItems(list);
        setSel(null);
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : 'Erro ao carregar');
      }
    })();
  }, []);

  async function open(id: string) {
    setLoadingCost(true);
    setSel(null);
    try {
      setSel(await getRecipeCost(id));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Erro ao calcular custo');
    } finally {
      setLoadingCost(false);
    }
  }

  if (err) return <p className="text-danger">{err}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Receitas</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <ul className="divide-y divide-border/50">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-muted">Carregando…</li>
            ) : (
              items.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => open(r.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-border/30"
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="text-sm text-muted">{r.yield} {r.yieldUnit} · {brl(r.salePrice)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-muted">Custo da receita</h2>
          {loadingCost ? (
            <p className="text-muted">Calculando…</p>
          ) : !sel ? (
            <p className="text-muted">Selecione uma receita ao lado.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Custo total" value={brl(sel.cost.totalCost)} />
                <Metric label="Margem" value={pct(sel.cost.marginPct)} tone={sel.cost.marginPct >= 0 ? 'success' : 'danger'} />
                <Metric label="Lucro" value={brl(sel.cost.profit)} />
                <Metric label="Preço venda" value={brl(sel.cost.salePrice)} />
              </div>

              <div>
                <p className="mb-2 text-xs text-muted">
                  Insumos · desperdício {num(sel.recipe.wastePct)}% ({brl(sel.cost.wasteCost)})
                </p>
                <table className="w-full text-sm">
                  <tbody>
                    {sel.cost.items.map((it, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-2">{it.name}</td>
                        <td className="py-2 text-right text-muted">
                          {num(it.amount)} {it.unit}
                        </td>
                        <td className="py-2 text-right">{brl(it.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'danger' }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : ''}`}>
        {value}
      </p>
    </div>
  );
}
