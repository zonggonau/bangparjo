const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const updated = await prisma.order.updateMany({
    where: { status: 'FULFILLING' },
    data: { status: 'PAID' }
  });
  console.log('Reset ' + updated.count + ' orders from FULFILLING back to PAID.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
