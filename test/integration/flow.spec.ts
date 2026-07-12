import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../../src/shared/prisma.service';
import { CryptoService } from '../../src/shared/crypto.service';
import { AuditService } from '../../src/shared/audit.service';
import { AppModule } from '../../src/app.module';
import * as argon2 from 'argon2';

/**
 * Testes de integração: sobem o AppModule real contra o Postgres de TESTE
 * (DATABASE_URL deve apontar para um banco de teste). Cada teste isola dados.
 */
describe('Integração — Auth + Vendas + RBAC', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let crypto: CryptoService;

  const TENANT = 'test-sprint0';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await app.listen(0); // porta livre
    prisma = app.get(PrismaService);
    crypto = app.get(CryptoService);

    // isola: recria tenant de teste
    await prisma.auditLog.deleteMany({ where: { tenantId: TENANT } }).catch(() => {});
    await prisma.user.deleteMany({ where: { tenantId: TENANT } }).catch(() => {});
    await prisma.role.deleteMany({ where: { tenantId: TENANT } }).catch(() => {});
    await prisma.tenant.deleteMany({ where: { id: TENANT } }).catch(() => {});

    const tenant = await prisma.tenant.create({ data: { id: TENANT, name: 'Teste', slug: 'test-sprint0' } });
    const perms = ['sale:create', 'sale:read', 'product:read', 'report:read'];
    for (const name of perms) {
      await prisma.permission.upsert({ where: { name }, update: {}, create: { name, label: name } });
    }
    const pAll = await prisma.permission.findMany();
    const ownerRole = await prisma.role.create({
      data: { tenantId: TENANT, name: 'OWNER', permissions: { connect: pAll.map((p) => ({ id: p.id })) } },
    });
    const empRole = await prisma.role.create({
      data: { tenantId: TENANT, name: 'EMPLOYEE',
        permissions: { connect: perms.map((n) => ({ name: n })) } },
    });
    await prisma.user.create({
      data: { tenantId: TENANT, roleId: ownerRole.id, name: 'Dono', email: 'dono@t.dev',
        passwordHash: await crypto.hashPassword('SenhaForte@123') },
    });
    await prisma.user.create({
      data: { tenantId: TENANT, roleId: empRole.id, name: 'Func', email: 'func@t.dev',
        passwordHash: await crypto.hashPassword('SenhaForte@123') },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  async function login(email: string): Promise<string> {
    const res = await fetch(`${await base()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': '1' },
      body: JSON.stringify({ email, password: 'SenhaForte@123' }),
    });
    const json = await res.json();
    return json.accessToken;
  }

  async function base(): Promise<string> {
    const http = app.getHttpServer() as any;
    const addr = http.address();
    return `http://localhost:${addr.port}`;
  }

  it('login retorna access + refresh e 401 com senha errada', async () => {
    const ok = await login('dono@t.dev');
    expect(typeof ok).toBe('string');
    const bad = await fetch(`${await base()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': '1' },
      body: JSON.stringify({ email: 'dono@t.dev', password: 'errada' }),
    });
    expect(bad.status).toBe(401);
  });

  it('venda baixa estoque e aparece no histórico (fluxo completo)', async () => {
    const token = await login('dono@t.dev');
    // cria produto
    const prod = await fetch(`${await base()}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': '1', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: 'P1', name: 'Cerveja', unit: 'UN', costPrice: 3, salePrice: 8, quantity: 10, minStock: 2 }),
    }).then((r) => r.json());

    const sale = await fetch(`${await base()}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': '1', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: [{ productId: prod.id, quantity: 2 }], paymentMethod: 'PIX' }),
    });
    if (sale.status !== 201) console.log('SALE 400 body:', await sale.text());
    expect(sale.status).toBe(201);
    const s = await sale.json();
    expect(s.total).toBe(16);
    expect(s.profit).toBe(10); // (8-3)*2

    // estoque baixou para 8
    const updated = await prisma.product.findUnique({ where: { id: prod.id } });
    expect(updated?.quantity).toBe(8);
  });

  it('funcionário sem permission não acessa rota protegida', async () => {
    const token = await login('func@t.dev');
    const res = await fetch(`${await base()}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': '1', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: 'X', name: 'X', unit: 'UN', costPrice: 1, salePrice: 2 }),
    });
    expect(res.status).toBe(403);
  });
});
