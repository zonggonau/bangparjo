import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.storeSetting.findMany();
  console.log('Store Settings:', JSON.stringify(settings, null, 2));
  const tiers = await prisma.marginTier.findMany({ orderBy: { min: 'asc' } });
  console.log('Margin Tiers:', JSON.stringify(tiers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
