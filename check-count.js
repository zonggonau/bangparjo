const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.order.count({ where: { status: 'FULFILLING' } });
  console.log('Count of FULFILLING orders:', count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
