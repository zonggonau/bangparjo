import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up old margin tiers...');
  await prisma.marginTier.deleteMany();

  const tiers = [
    { min: 0, max: 1, pct: 70 },
    { min: 1, max: 2, pct: 60 },
    { min: 2, max: 3, pct: 40 },
    { min: 3, max: 4, pct: 35 },
    { min: 4, max: 5, pct: 30 },
    { min: 5, max: 7, pct: 25 },
    { min: 7, max: 10, pct: 20 },
    { min: 10, max: 20, pct: 18 },
    { min: 20, max: 30, pct: 16 },
    { min: 30, max: 40, pct: 10 },
    { min: 40, max: 50, pct: 8 },
    { min: 50, max: 100, pct: 6 },
    { min: 100, max: 500, pct: 5 },
    { min: 500, max: null, pct: 3 },
  ];

  console.log('Inserting new tiers...');
  for (const tier of tiers) {
    await prisma.marginTier.create({
      data: tier
    });
  }

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
