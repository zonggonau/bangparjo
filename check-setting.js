const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.storeSetting.findUnique({ where: { key: 'cjPayType' } });
  console.log("DB Setting for cjPayType:", s);
}
main().catch(console.error).finally(() => prisma.$disconnect());
