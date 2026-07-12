# BarFlow — Roadmap & Sprints

Sistema entregue em incrementos verticalmente funcionais (cada sprint deixa o
sistema rodando e testado). Esta entrega cobre a **Sprint 0 (Fundação Sênior)**.

## Sprint 0 — Fundação Sênior (ENTREGUE NESTA VEZ)
- [x] Planejamento, arquitetura e decisões técnicas (ARCHITECTURE.md)
- [x] Modelo de dados Prisma (multi-tenant + multi-filial, RBAC, produtos, receitas, estoque, vendas, auditoria) — DATABASE.md
- [x] Backend NestJS: auth (Argon2id, JWT access + refresh cookie HttpOnly, rotação, revogação), RBAC
- [x] Módulos: users, products (+fornecedores/categorias), recipes (motor de custo em cascata em %/ml/L/g/kg/un), inventory, sales (PDV com baixa de estoque), dashboard (KPIs), reports (XLSX/CSV/PDF)
- [x] Swagger, Helmet, CORS configurável, Throttler (rate limit / brute force)
- [x] Testes: unitário (RecipeCostService), integração (auth + vendas + RBAC), e2e (fluxo login→venda)
- [x] Docker Compose (postgres + api), .env, seeds, README
- [x] Frontend iniciado: design system (Tailwind + tokens claro/escuro), auth (login responsivo), layout shell, telas Dashboard / Produtos / Receitas (consulta)

## Sprint 1 — Frontend de Operação
- [ ] Telas completas: Vendas (PDV touch), Estoque (movimentações), Receitas (CRUD + cálculo ao vivo)
- [ ] Pesquisa instantânea (fuzzy) + filtros rápidos
- [ ] Gráficos (pizza, barras, linha, área, heatmap, KPIs)
- [ ] Modo claro/escuro persistido; acessibilidade (ARIA, foco)

## Sprint 2 — PWA & Offline
- [ ] Service worker, manifest, installável
- [ ] Fila de vendas offline (sync quando volta conexão)
- [ ] Virtualização de listas grandes

## Sprint 3 — Pagamentos & Impressão
- [ ] Integração PIX (emissão de cobrança, webhook de confirmação)
- [ ] Integração TEF (stub pronto)
- [ ] Cupom não fiscal + impressão térmica (ESC/POS)
- [ ] Leitor de código de barras (USB/HID + câmera)

## Sprint 4 — SaaS & Multi-filial
- [ ] Onboarding de empresa/filial, convites
- [ ] Row-Level Security no Postgres por tenant
- [ ] Rate limit por tenant + quotas
- [ ] Dashboard por filial + consolidado

## Sprint 5 — Relatórios & Dados
- [ ] Exportação agendada, templates
- [ ] Importação de planilhas (produtos/estoque) com validação
- [ ] Painel de auditoria para o dono

## Sprint 6 — Hardening & Ops
- [ ] Backup automático (pg_dump + object storage)
- [ ] Observabilidade (logs estruturados, métricas)
- [ ] CI/CD (testes + build + deploy)
- [ ] Pen-test interno contra OWASP Top 10

## Critérios de aceitação por sprint
Cada sprint fecha com: testes verdes, build de produção, doc atualizada e
commit organizado. Nunca simplificar funcionalidade sem justificativa técnica
registrada em ARCHITECTURE.md.
