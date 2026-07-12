'use client';

import { useEffect, useState } from 'react';
import { getKpis, getSeries, ApiError, type Kpis, type SeriePoint } from '@/lib/api';
import { brl, num } from '@/lib/format';
import { Card, Stat, Badge } from '@/components/ui';

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [series, setSeries] = useState<SeriePoint[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [k, s] = await Promise.all([getKpis(), getSeries(30)]);
        setKpis(k);
        setSeries(s);
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : 'Erro ao carregar');
      }
    })();
  }, []);

  if (err) return <p className="text-danger">{err}</p>;
  if (!kpis) return <p className="text-muted">Carregando…</p>;

  const maxTotal = Math.max(1, ...series.map((s) => s.total));
  const visible = series.slice(-14);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Faturamento (mês)" value={brl(kpis.faturamento.mes)} hint={`Hoje: ${brl(kpis.faturamento.hoje)}`} />
        <Stat label="Lucro (mês)" value={brl(kpis.lucro.mes)} hint={`Hoje: ${brl(kpis.lucro.hoje)}`} />
        <Stat label="Ticket médio" value={brl(kpis.ticketMedio)} hint={`${kpis.totalPedidos} pedidos no mês`} />
        <Stat label="Estoque baixo" value={String(kpis.estoqueBaixo)} hint={kpis.estoqueBaixo > 0 ? 'atenção' : 'ok'} />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-muted">Faturamento (últimos 14 dias)</h2>
        <div className="flex h-32 items-end gap-1">
          {visible.map((p) => (
            <div key={p.date} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${p.date}: ${brl(p.total)}`}>
              <div className="w-full rounded-t bg-primary/70" style={{ height: `${(p.total / maxTotal) * 100}%` }} />
              <span className="text-[9px] text-muted">{p.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-muted">Produtos mais vendidos (mês)</h2>
          {kpis.produtosMaisVendidos.length === 0 ? (
            <p className="text-sm text-muted">Sem vendas registradas.</p>
          ) : (
            <ul className="space-y-2">
              {kpis.produtosMaisVendidos.map((p) => (
                <li key={p.name} className="flex items-center justify-between text-sm">
                  <span>{p.name}</span>
                  <Badge>{num(p.qty)} un.</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-muted">Top funcionários (mês)</h2>
          {kpis.funcionariosTop.length === 0 ? (
            <p className="text-sm text-muted">Sem vendas registradas.</p>
          ) : (
            <ul className="space-y-2">
              {kpis.funcionariosTop.map((f) => (
                <li key={f.name} className="flex items-center justify-between text-sm">
                  <span>{f.name}</span>
                  <Badge tone="success">{brl(f.total)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
