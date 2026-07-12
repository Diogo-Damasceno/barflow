export const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);

export const num = (n: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n ?? 0);

export const pct = (n: number) => `${num(n)}%`;
