const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.order.findMany({
  orderBy: { createdAt: 'desc' },
  take: 10
}).then(orders => {
  console.log('Top 10 Latest Orders:');
  orders.forEach(o => console.log(`${o.orderNum} | ${o.status} | cjOrderId: ${o.cjOrderId}`));
}).finally(() => {
  prisma.$disconnect();
});
