require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { rolename: 'ADMIN' }, update: {}, create: { rolename: 'ADMIN' },
  });
  await prisma.role.upsert({
    where: { rolename: 'normal' }, update: {}, create: { rolename: 'normal' },
  });

  const normal = await prisma.membership.upsert({
    where: { mname: 'normal' }, update: {}, create: { mname: 'normal', score: 10 },
  });

  const hash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin@123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', fullname: 'Administrator', password: hash,
              roleid: adminRole.roleid, mid: normal.mid },
  });

  if ((await prisma.product.count()) === 0) {
    await prisma.product.createMany({
      data: [
        { pname: 'Bàn phím cơ', price: 850000, quantity: 50 },
        { pname: 'Chuột không dây', price: 350000, quantity: 100 },
        { pname: 'Màn hình 24 inch', price: 3200000, quantity: 20 },
      ],
    });
  }
}

main().finally(() => prisma.$disconnect());
