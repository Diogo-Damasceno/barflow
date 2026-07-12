import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'user:create', 'user:read', 'user:update', 'user:delete',
  'role:create', 'role:read',
  'product:create', 'product:read', 'product:update', 'product:delete',
  'supplier:create', 'category:create',
  'recipe:create', 'recipe:read',
  'inventory:read', 'inventory:write',
  'sale:create', 'sale:read', 'sale:cancel',
  'report:read', 'report:export',
  'settings:write',
];

async function main() {
  // permissões base
  for (const name of PERMISSIONS) {
    const label = name.split(':').join(' ');
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, label },
    });
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: { name: 'Estabelecimento Demo', slug: 'demo' },
  });

  const all = await prisma.permission.findMany();
  const ownerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'OWNER' } },
    update: { permissions: { set: all.map((p) => ({ id: p.id })) } },
    create: {
      tenantId: tenant.id, name: 'OWNER', description: 'Dono — acesso total',
      permissions: { connect: all.map((p) => ({ id: p.id })) },
    },
  });

  const empPerms = ['product:read', 'recipe:read', 'inventory:read', 'sale:create', 'sale:read', 'report:read'];
  const empRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'EMPLOYEE' } },
    update: {},
    create: {
      tenantId: tenant.id, name: 'EMPLOYEE', description: 'Funcionário — vendas',
      permissions: { connect: all.filter((p) => empPerms.includes(p.name)).map((p) => ({ id: p.id })) },
    },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'dono@barflow.dev' } },
    update: {},
    create: {
      tenantId: tenant.id, roleId: ownerRole.id, name: 'Dono Demo',
      email: 'dono@barflow.dev',
      passwordHash: await argon2.hash('SenhaForte@123'),
    },
  });

  // produtos de exemplo (usados em receitas)
  const whisky = await prisma.product.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'WHISKY' } },
    update: {},
    create: {
      tenantId: tenant.id, code: 'WHISKY', name: 'Whisky', unit: 'ML',
      quantity: 5000, minStock: 500, costPrice: 0.5, salePrice: 2,
    },
  });
  const energetico = await prisma.product.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'ENERG' } },
    update: {},
    create: {
      tenantId: tenant.id, code: 'ENERG', name: 'Energético', unit: 'ML',
      quantity: 8000, minStock: 1000, costPrice: 0.2, salePrice: 1,
    },
  });

  await prisma.recipe.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Copão' } },
    update: {},
    create: {
      tenantId: tenant.id, name: 'Copão', yield: 500, yieldUnit: 'ML',
      wastePct: 5, salePrice: 18,
      items: {
        create: [
          { productId: whisky.id, amount: 125, unit: 'ML' },
          { productId: energetico.id, amount: 325, unit: 'ML' },
        ],
      },
    },
  });

  console.log('Seed concluído: tenant=demo, dono@barflow.dev / SenhaForte@123');
}

main().catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
