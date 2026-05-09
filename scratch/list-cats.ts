import { prisma } from '../src/lib/db';

async function main() {
  const cats = await prisma.category.findMany({
    select: { name: true, slug: true },
    take: 100
  });
  console.log(JSON.stringify(cats, null, 2));
}

main();
