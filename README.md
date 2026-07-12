# BarFlow

API de gestão para bares e restaurantes: **multi-tenant**, **RBAC** (papéis e permissões),
motor de **custo de receitas em cascata**, controle de **estoque**, **vendas** com baixa
transacional, **dashboard** de KPIs e **relatórios** exportáveis (CSV/XLSX/PDF).

Construído com NestJS + Prisma + PostgreSQL, com foco em segurança (OWASP: argon2,
JWT access+refresh, helmet, CORS restrito, guard de CSRF, RBAC por permissão e
isolamento por tenant em todas as queries).

---

## Stack

- **NestJS 10** (TypeScript, arquitetura modular)
- **Prisma** ORM + **PostgreSQL 16**
- **argon2** (hash de senha), **@nestjs/jwt** (access + refresh)
- **Jest** (unit / integration / e2e)
- **Swagger** em `/docs`

---

## Instalação

Requisitos: Node 20+, Docker (para o Postgres) e npm.

```bash
# 1. dependências
npm install

# 2. subir o banco
docker compose up -d          # postgres em 127.0.0.1:5432

# 3. variáveis de ambiente
cp .env.example .env          # edite os segredos (JWT_SECRET etc.)

# 4. migrations + client + seed
npx prisma migrate deploy
npx prisma generate
npx ts-node prisma/seed.ts     # cria tenant demo + usuário dono

# 5. build e run
npm run build
npm start                      # API em http://localhost:3001  (swagger em /docs)
```

Modo desenvolvimento (watch):

```bash
npm run start:dev
```

---

## Uso

Após o seed, use as credenciais do tenant demo:

```bash
# login -> retorna accessToken + refreshToken
curl -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-Requested-With: 1' \
  -d '{"email":"dono@barflow.dev","password":"SenhaForte@123"}'

# usar o token
TOKEN="<accessToken>"
curl http://localhost:3001/dashboard/kpis -H "Authorization: Bearer $TOKEN"
```

> O header `X-Requested-With` é obrigatório em mutações (POST/PATCH/PUT/DELETE)
> como defesa anti-CSRF.

Endpoints principais:

| Área       | Rotas (exemplos)                                        |
|------------|---------------------------------------------------------|
| Auth       | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Usuários   | `POST /users`, `GET /users`, `POST /users/roles`        |
| Produtos   | `POST /products`, `GET /products`, `PATCH /products/:id/price` |
| Receitas   | `POST /recipes`, `GET /recipes/:id/cost`                |
| Estoque    | `POST /inventory`, `GET /inventory/low`                 |
| Vendas     | `POST /sales`, `GET /sales`                             |
| Dashboard  | `GET /dashboard/kpis`, `GET /dashboard/series`          |
| Relatórios | `GET /reports/sales?format=csv|xlsx|pdf`               |

---

## Deploy com Docker (recomendado)

Sobe API + site + banco num comando:

```bash
docker compose up -d --build
```

Acesse o site em http://localhost:3000 (login demo: `dono@barflow.dev` / `SenhaForte@123`).
Veja `DEPLOY.md` (implantação/segurança) e `GUIA_CLIENTE.md` (uso do dia a dia).

---

## Como funciona

- **Multi-tenant**: cada `Tenant` isola seus dados; toda query filtra por `tenantId`
  extraído do JWT. O login resolve o tenant pelo header `X-Tenant-Id` (modo SaaS) ou,
  na ausência dele, pelo próprio e-mail do usuário (modo single-tenant/dev).
- **RBAC**: `Role` agrega `Permission`s (ex.: `sale:create`, `report:read`). O
  `PermissionsGuard` bloqueia rotas sem a permissão necessária (403).
- **Custo de receita em cascata**: o custo de um item pode vir de um produto ou de
  outra receita, aplicando rendimento e percentual de desperdício recursivamente.
- **Venda transacional**: criar uma venda calcula total/lucro, grava os itens como
  snapshot (preço e custo do momento) e baixa o estoque numa transação Prisma.
- **Auditoria**: ações sensíveis geram `AuditLog` append-only.

---

## Testes

```bash
npm test              # roda unit + integration + e2e (runInBand)
npm run test:unit
npm run test:int
npm run test:e2e
```

As suítes de integração/e2e sobem o `AppModule` real contra o Postgres e isolam
os dados por tenant em cada `beforeAll`.

---

## O que NÃO faz

- Não é um PDV/frontend — é apenas a API (o frontend Next.js é um módulo à parte).
- Não processa pagamentos reais (o `paymentMethod` é apenas registro).
- Não emite documentos fiscais (NF-e/NFC-e).
- Não faz gestão financeira completa (contas a pagar/receber, conciliação).

---

## Aviso

Projeto de portfólio / estudo. Revise os segredos (`JWT_SECRET`, credenciais do banco)
e as políticas de segurança antes de qualquer uso em produção. Fornecido "as is",
sem garantias.

## Licença

MIT.
