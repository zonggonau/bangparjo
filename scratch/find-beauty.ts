import { prisma } from '../src/lib/db';

async function main() {
  const beauty = await prisma.category.findMany({
    where: { name: { contains: 'Beauty', mode: 'insensitive' } },
    select: { name: true, slug: true }
  });

  console.log('Beauty:', beauty);
}

main();
