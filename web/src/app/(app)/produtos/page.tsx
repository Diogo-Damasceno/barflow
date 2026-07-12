'use client';

import { useEffect, useState } from 'react';
import { getProducts, ApiError, type Product } from '@/lib/api';
import { brl, num } from '@/lib/format';
import { Card, Badge } from '@/components/ui';

export default function ProdutosPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setItems(await getProducts());
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : 'Erro ao carregar');
      }
    })();
  }, []);

  if (err) return <p className="text-danger">{err}</p>;

  const filtered = q
    ? items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.code.toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className="w-56 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {items.length === 0 ? (
        <p className="text-muted">Carregando…</p>
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 text-right font-medium">Estoque</th>
                <th className="px-4 py-3 text-right font-medium">Custo</th>
                <th className="px-4 py-3 text-right font-medium">Preço</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const low = p.quantity <= p.minStock;
                return (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-muted">{p.code}</td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {num(p.quantity)} {p.unit}
                      {low && <Badge tone="danger">baixo</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">{brl(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right">{brl(p.salePrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
