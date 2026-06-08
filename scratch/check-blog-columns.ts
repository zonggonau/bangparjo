import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Use raw query to check columns
  const result = await prisma.$queryRawUnsafe<Array<{column_name: string}>>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'BlogPost' ORDER BY ordinal_position`
  );
  console.log('BlogPost columns:', result.map(r => r.column_name));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
