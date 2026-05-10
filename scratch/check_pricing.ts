import { prisma } from './src/lib/db';

async function check() {
  const settings = await prisma.storeSetting.findMany();
  const tiers = await prisma.marginTier.findMany({ orderBy: { min: 'asc' } });
  const products = await prisma.product.findMany({
    take: 5,
    include: { variants: true }
  });

  console.log('--- STORE SETTINGS ---');
  settings.forEach(s => console.log(`${s.key}: ${s.value}`));
  
  console.log('\n--- MARGIN TIERS ---');
  tiers.forEach(t => console.log(`$${t.min} - $${t.max || 'inf'}: +${t.pct}%`));

  console.log('\n--- PRODUCT PRICES (First 5) ---');
  products.forEach(p => {
    const base = p.variants[0]?.sellingPrice || 0;
    console.log(`${p.name}: Base Cost $${base}`);
  });
}

check().catch(console.error);
