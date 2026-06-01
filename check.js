const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const orders = await prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  orders.forEach(o => console.log(o.orderNum, o.status, o.cjOrderId));
}
main().catch(console.error).finally(() => prisma.$disconnect());
