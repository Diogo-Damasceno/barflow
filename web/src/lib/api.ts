// Cliente HTTP fino para a API BarFlow. Anexa o Bearer token (lido do cookie)
// e o header anti-CSRF exigido pelo backend em mutações.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const TOKEN_COOKIE = 'bf_token';

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)bf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function setToken(token: string) {
  // SameSite=Lax; sem httpOnly pois é lido no client (MVP). Em prod: cookie httpOnly via route handler.
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=900; SameSite=Lax`;
}

export function clearToken() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Opts = { method?: string; body?: unknown; token?: string };

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  const { method = 'GET', body, token } = opts;
  const bearer = token ?? getToken();
  const headers: Record<string, string> = { 'X-Requested-With': '1' };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const j = await res.json();
      msg = j.message ?? msg;
    } catch {
      /* corpo não-JSON */
    }
    throw new ApiError(res.status, Array.isArray(msg) ? msg.join(', ') : msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- endpoints tipados ----

export type LoginResult = { accessToken: string; refreshToken: string };

export const login = (email: string, password: string) =>
  api<LoginResult>('/auth/login', { method: 'POST', body: { email, password } });

export type Kpis = {
  faturamento: { hoje: number; semana: number; mes: number; ano: number };
  lucro: { hoje: number; semana: number; mes: number; ano: number };
  custos: { mes: number };
  ticketMedio: number;
  totalPedidos: number;
  produtosMaisVendidos: { name: string; qty: number }[];
  funcionariosTop: { name: string; total: number }[];
  estoqueBaixo: number;
};

export const getKpis = (token?: string) => api<Kpis>('/dashboard/kpis', { token });

export type SeriePoint = { date: string; total: number; profit: number };
export const getSeries = (days = 30, token?: string) =>
  api<SeriePoint[]>(`/dashboard/series?days=${days}`, { token });

export type Product = {
  id: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  category?: { name: string } | null;
  supplier?: { name: string } | null;
};
export const getProducts = (token?: string) => api<Product[]>('/products', { token });

export type Recipe = {
  id: string;
  name: string;
  yield: number;
  yieldUnit: string;
  wastePct: number;
  salePrice: number;
  items: { id: string; amount: number; unit: string; product?: { name: string } }[];
};
export const getRecipes = (token?: string) => api<Recipe[]>('/recipes', { token });

export type RecipeCost = {
  recipe: { id: string; name: string; yield: number; wastePct: number };
  cost: {
    items: { name: string; amount: number; unit: string; cost: number }[];
    rawCost: number;
    wasteCost: number;
    totalCost: number;
    salePrice: number;
    profit: number;
    marginPct: number;
  };
};
export const getRecipeCost = (id: string, token?: string) =>
  api<RecipeCost>(`/recipes/${id}/cost`, { token });
