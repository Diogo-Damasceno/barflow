import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../../src/shared/prisma.service';
import { CryptoService } from '../../src/shared/crypto.service';
import { AppModule } from '../../src/app.module';

/**
 * E2E (ponta-a-ponta): valida o fluxo comercial completo num único tenant:
 * login -> produtos -> receita (custo) -> venda -> dashboard.
 * Requer Postgres de teste em DATABASE_URL.
 */
describe('E2E — fluxo comercial completo', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const TENANT = 'e2e-sprint0';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await app.listen(0);
    prisma = app.get(PrismaService);
    const crypto = app.get(CryptoService);

    await prisma.auditLog.deleteMany({ where: { tenantId: TENANT } }).catch(() => {});
    await prisma.recipeItem.deleteMany({ where: { recipe: { tenantId: TENANT } } }).catch(() => {});
    await prisma.recipe.deleteMany({ where: { tenantId: TENANT } }).catch(() => {});
    await prisma.user.deleteMany({ where: { tenantId: TENANT } }).catch(() => {});
    await prisma.role.deleteMany({ where: { tenantId: TENANT } }).catch(() => {});
    await prisma.product.deleteMany({ where: { tenantId: TENANT } }).catch(() => {});
    await prisma.tenant.deleteMany({ where: { id: TENANT } }).catch(() => {});

    const tenant = await prisma.tenant.create({ data: { id: TENANT, name: 'E2E', slug: 'e2e-sprint0' } });
    const perms = ['product:create', 'product:read', 'recipe:create', 'recipe:read', 'sale:create', 'sale:read', 'report:read'];
    for (const name of perms) await prisma.permission.upsert({ where: { name }, update: {}, create: { name, label: name } });
    const pAll = await prisma.permission.findMany();
    const role = await prisma.role.create({ data: { tenantId: TENANT, name: 'OWNER', permissions: { connect: pAll.map((p) => ({ id: p.id })) } } });
    await prisma.user.create({ data: { tenantId: TENANT, roleId: role.id, name: 'D', email: 'd@e2e.dev', passwordHash: await crypto.hashPassword('SenhaForte@123') } });
  });

  afterAll(async () => { await prisma.$disconnect(); await app.close(); });

  function base() { const a = (app.getHttpServer() as any).address(); return `http://localhost:${a.port}`; }
  async function token() {
    const r = await fetch(`${base()}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': '1' },
      body: JSON.stringify({ email: 'd@e2e.dev', password: 'SenhaForte@123' }),
    });
    return (await r.json()).accessToken;
  }

  it('fluxo: produto -> receita (custo) -> venda -> dashboard', async () => {
    const tk = await token();

    const w = await fetch(`${base()}/products`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': '1', Authorization: `Bearer ${tk}` },
      body: JSON.stringify({ code: 'W', name: 'Whisky', unit: 'ML', costPrice: 0.5, salePrice: 2, quantity: 5000, minStock: 0 }),
    }).then((r) => r.json());
    const e = await fetch(`${base()}/products`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': '1', Authorization: `Bearer ${tk}` },
      body: JSON.stringify({ code: 'E', name: 'Energético', unit: 'ML', costPrice: 0.2, salePrice: 1, quantity: 8000, minStock: 0 }),
    }).then((r) => r.json());

    const recipe = await fetch(`${base()}/recipes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': '1', Authorization: `Bearer ${tk}` },
      body: JSON.stringify({ name: 'Copão', yield: 500, yieldUnit: 'ML', wastePct: 5, salePrice: 18,
        items: [{ productId: w.id, amount: 125, unit: 'ML' }, { productId: e.id, amount: 325, unit: 'ML' }] }),
    }).then((r) => r.json());
    if (!recipe.id) console.log('RECIPE create body:', JSON.stringify(recipe));

    const costRes = await fetch(`${base()}/recipes/${recipe.id}/cost`, {
      headers: { Authorization: `Bearer ${tk}` } },
    );
    if (costRes.status !== 200) console.log('COST status', costRes.status, 'body', await costRes.text());
    const cost = await costRes.json();
    expect(cost.cost.totalCost).toBeGreaterThan(0);

    const sale = await fetch(`${base()}/sales`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': '1', Authorization: `Bearer ${tk}` },
      body: JSON.stringify({ items: [{ productId: w.id, quantity: 250 }], paymentMethod: 'CARD' }),
    });
    expect(sale.status).toBe(201);

    const kpis = await fetch(`${base()}/dashboard/kpis`, { headers: { Authorization: `Bearer ${tk}` } }).then((r) => r.json());
    expect(kpis.faturamento.mes).toBeGreaterThan(0);
    expect(kpis.totalPedidos).toBeGreaterThan(0);
  });
});
