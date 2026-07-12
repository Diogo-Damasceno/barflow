# BarFlow — Arquitetura Técnica

Sistema de gestão para bares, adegas, restaurantes e estabelecimentos similares.
Web responsivo (PWA-ready), multiplataforma, nível comercial.

> Status: **Fundação Sênior v1** — nesta entrega entregamos o planejamento completo
> (este doc + DATABASE + ROADMAP), o backend NestJS rodando com auth/JWT/refresh
> HttpOnly/RBAC + módulos de produtos/receitas/estoque/vendas/dashboard/relatórios,
> modelo de dados Prisma com multi-tenant e multi-filial já modelados, testes
> (unit/integration/e2e) verdes e infra Docker Compose. O frontend é iniciado nas
> telas centrais; as demais sprints do ROADMAP cobrem o restante.

## 1. Decisões de Stack (e por quê)

| Camada | Escolha | Justificativa técnica |
|--------|---------|------------------------|
| Frontend | **Next.js 15 (App Router) + React 19 + TypeScript** | SSR/ISR para SEO e performance de primeiro paint; code-splitting por rota nativo; PWA via `next-pwa`; um único repositório com o backend facilita monorepo. |
| UI | **TailwindCSS + shadcn/ui** | Design tokens, acessibilidade (Radix), tema claro/escuro sem retrabalho; combina Stripe/Linear/Vercel aesthetic. |
| Backend | **NestJS + TypeScript** | Arquitetura limpa por padrão (modules/guards/pipes/interceptors), DI nativo, decorators para RBAC, Swagger out-of-the-box, ótimo para times e manutenção. |
| DB | **PostgreSQL 16** | ACID, JSONB para auditoria flexível, índices GIN/parciais, extensões (pgcrypto p/ cripto). Escala para milhares de usuários. |
| ORM | **Prisma** | Tipagem segura end-to-end, migrações, seeds, e *(crítico)* gera cliente que impede SQL injection por construção (queries parametrizadas). |
| Auth | **JWT access + Refresh em Cookie HttpOnly** | Access curto (15min) em memória/Authorization; refresh em cookie HttpOnly+SameSite=Lax+Secure, rota protegida com rotação. |
| Hash | **Argon2id** | Resistente a GPU/side-channel; superior a bcrypt para senhas. |
| Infra | **Docker + Docker Compose** | Reprodutibilidade; `compose` sobe postgres+api+ (futuro) frontend. |

### Decisões de segurança (OWASP)

- **SQL Injection**: eliminado por construção (Prisma parametriza tudo).
- **XSS**: React escapa por padrão; sanitização de HTML (ex.: observações) com DOMPurify no client e Zod no server.
- **CSRF**: cookies `SameSite=Lax` + refresh via cookie (não header); endpoints state-changing exigem header `X-Requested-With` checado por interceptor.
- **Helmet**: headers de segurança no Nest (`helmet`).
- **CORS**: origem configurável por env (`CORS_ORIGIN`), credenciais só quando necessário.
- **Rate Limit / Brute Force**: `@nestjs/throttler` global; tentativas de login contabilizadas (backoff + lockout progressivo no Redis futuro).
- **Validação**: `class-validator` + `zod` nos DTOs (fail-fast, 422).
- **Sanitização**: trim/normalize em DTOs; criptografia de dados sensíveis (ex.: tokens de integração PIX/TEF) com AES-256-GCM (`pgcrypto`/`crypto`).
- **Auditoria**: tabela `AuditLog` append-only para ações críticas (login, venda, alteração de preço, permissão).
- **Sessões/Expiração**: refresh tokens com `revokedAt` + TTL; logout revoga; Troca de senha revoga todos os refresh do usuário.
- **RBAC**: `Role` + `Permission` many-to-many; `PermissionsGuard` por decorators `@Require(...)`. Dono/Funcionário embutidos; novos papéis criáveis.
- **HTTPS Ready**: terminação no proxy (Traefik/Caddy futuro); app já manda HSTS via Helmet quando `HTTPS=true`.
- **Backup**: `pg_dump` agendável via script; seeds para demo.

### Decisões de arquitetura

- **Multi-tenant (SaaS) e Multi-filial desde o dia 1**: toda entidade de negócio tem `tenantId` (empresa) e, onde fizer sentido, `branchId` (filial). Isolamento por row-level (filtro aplicado em todos os serviços / futuro row-level security do PG). Isso evita reescrita ao virar SaaS.
- **Motor de custo de receitas desacoplado**: `RecipeCostService` é um *domain service* puro (testável, sem DB) que recebe ingredientes + preços de compra atuais e calcula custo/margem/lucro/rendimento/desperdício. Ao alterar preço de um produto, um evento recalcula receitas que o usam (cálculo sob demanda + cache, não armazena custo Stale).
- **Unidades normalizadas**: receitas aceitam ml, L, g, kg, un, %. Internamente normalizamos para a unidade-base do ingrediente (ex.: 25% de um copo de 500ml = 125ml) no `UnitService`.
- **Vendas como evento + efeito colateral**: ao criar venda, transação DB atualiza estoque (saída) e gera `StockMovement` + `AuditLog`. Tudo em uma transação Prisma.

## 2. Módulos (Clean Architecture dentro do Nest)

```
src/
  shared/      # guards, decorators, filters, interceptors, prisma, crypto, audit
  auth/        # login, refresh, logout, troca-senha, perfil
  users/       # CRUD de usuários + papéis (RBAC)
  products/    # produtos + fornecedores + categorias
  recipes/     # receitas + ingredientes + RecipeCostService (cálculo em cascata)
  inventory/   # entradas/saídas/ajustes/movimentações/alertas
  sales/       # PDV: criar venda (atualiza estoque), cancelar, histórico
  dashboard/   # KPIs e séries (lazy, agregações SQL)
  reports/     # export XLSX/CSV/PDF (filtros)
  settings/    # config da empresa/filial
```

Regras: controllers nunca tocam Prisma direto; services aplicam regras; DTOs validam na borda; guards autorizam.

## 3. Performance

- Índices em `tenantId`, `branchId`, `createdAt`, `categoryId`, `barcode`, `roleId`.
- Paginação/cursor em listas; virtualização no client (`@tanstack/react-virtual`).
- Cache de KPIs (TTL 30s) e de preços de compra (usados no cálculo de custo).
- Lazy loading de rotas + dynamic imports de gráficos (`recharts`/`echarts`).

## 4. Próximos passos (ver ROADMAP.md)

Sprint 0 = fundação (esta entrega). Sprints 1–6 cobrem frontend completo, PWA/offline, PIX/TEF, notificações, import/export de planilhas e hardening de SaaS.
