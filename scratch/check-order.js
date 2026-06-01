const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const orders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log('RECENT ORDERS:', orders.map(o => ({ orderNum: o.orderNum, status: o.status, totalAmount: o.totalAmount, createdAt: o.createdAt })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
