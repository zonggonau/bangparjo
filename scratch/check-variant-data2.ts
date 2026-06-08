import { prisma } from '../src/lib/db';

async function main() {
  // Find products with different variant patterns
  // 1. Products with " / " in variant name (like "Gray / Breathable...")
  const slashVariants = await prisma.variant.findMany({
    where: { size: { contains: ' / ' } },
    take: 10,
    include: { product: { select: { name: true, cjId: true } } }
  });
  
  console.log("=== Variants with ' / ' pattern ===");
  for (const v of slashVariants) {
    console.log(`Product: ${v.product.name}`);
    console.log(`  color="${v.color}" size="${v.size}"`);
  }

  // 2. Products with "-Galaxy" pattern (smartwatch)
  const galaxyVariants = await prisma.variant.findMany({
    where: { color: { contains: 'Galaxy' } },
    take: 10,
    include: { product: { select: { name: true, cjId: true } } }
  });
  
  console.log("\n=== Variants with 'Galaxy' pattern ===");
  for (const v of galaxyVariants) {
    console.log(`Product: ${v.product.name}`);
    console.log(`  color="${v.color}" size="${v.size}"`);
  }

  // 3. Products with "ml" pattern (liquid)
  const mlVariants = await prisma.variant.findMany({
    where: { color: { contains: 'ml' } },
    take: 10,
    include: { product: { select: { name: true, cjId: true } } }
  });
  
  console.log("\n=== Variants with 'ml' pattern ===");
  for (const v of mlVariants) {
    console.log(`Product: ${v.product.name}`);
    console.log(`  color="${v.color}" size="${v.size}"`);
  }

  // 4. Show some products that have only 1 variant (no real color/size)
  const singleVariantProducts = await prisma.product.findMany({
    where: { variantCount: 1 },
    take: 5,
    include: { variants: true }
  });
  
  console.log("\n=== Single variant products ===");
  for (const p of singleVariantProducts) {
    for (const v of p.variants) {
      console.log(`Product: ${p.name}`);
      console.log(`  color="${v.color}" size="${v.size}"`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
