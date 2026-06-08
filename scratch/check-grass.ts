import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const variants = await prisma.variant.findMany({
    where: { color: { contains: 'Grass Green' } },
    select: { cjId: true, color: true, size: true }
  });
  console.log(JSON.stringify(variants, null, 2));
  await prisma.$disconnect();
}
main().catch(console.error);
