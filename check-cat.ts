import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.category.count();
  console.log(`Categories count: ${count}`);
}

main().finally(() => prisma.$disconnect());
