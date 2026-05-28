const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const order = await prisma.order.findUnique({ where: { orderNum: 'ORD-1779812549717' } });
  console.log(JSON.stringify(order.orderData, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
