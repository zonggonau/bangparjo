import { prisma } from '../src/lib/db';

/**
 * Analyze the color field to understand the pattern.
 * The color field currently stores "ColorName-Size" like "Sapphire Blue-M"
 * We need to split it into proper color and size.
 */
async function main() {
  // Get all unique color values (first 50)
  const colors = await prisma.variant.findMany({
    where: {
      NOT: { color: 'Default' }
    },
    select: { color: true },
    distinct: ['color'],
    take: 50
  });

  console.log("=== Sample color values ===");
  for (const c of colors) {
    // Try to split by last "-"
    const lastDash = c.color.lastIndexOf('-');
    if (lastDash > 0) {
      const possibleColor = c.color.substring(0, lastDash);
      const possibleSize = c.color.substring(lastDash + 1);
      console.log(`  "${c.color}" → color="${possibleColor}", size="${possibleSize}"`);
    } else {
      console.log(`  "${c.color}" → no dash found`);
    }
  }

  // Check what unique sizes we'd get
  const allVariants = await prisma.variant.findMany({
    where: {
      NOT: { color: 'Default' }
    },
    select: { color: true }
  });

  const sizeSet = new Set<string>();
  const colorSet = new Set<string>();
  
  for (const v of allVariants) {
    const lastDash = v.color.lastIndexOf('-');
    if (lastDash > 0) {
      const possibleColor = v.color.substring(0, lastDash);
      const possibleSize = v.color.substring(lastDash + 1);
      colorSet.add(possibleColor);
      sizeSet.add(possibleSize);
    } else {
      colorSet.add(v.color);
    }
  }

  console.log(`\n=== Extracted Colors (${colorSet.size}) ===`);
  console.log([...colorSet].sort().join(', '));
  
  console.log(`\n=== Extracted Sizes (${sizeSet.size}) ===`);
  console.log([...sizeSet].sort().join(', '));
}

main().catch(console.error).finally(() => prisma.$disconnect());
