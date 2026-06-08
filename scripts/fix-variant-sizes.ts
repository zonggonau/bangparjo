/**
 * Migration script: Fix existing variant data.
 * 
 * The old import logic stored the full variantNameEn in the `size` field.
 * This script updates the `color` and `size` fields to properly parsed values.
 * 
 * Run: npx tsx scripts/fix-variant-sizes.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Known size patterns (case-insensitive) */
const SIZE_PATTERNS = [
  // Standard letter sizes (including 2XL, 2X, etc.)
  /^(\d*)(XS|S|M|L|XL|XXL|XXXL|XXXXL)$/i,
  // Numeric sizes (shoe sizes like 36-48, sometimes with Men/Women)
  /^(\d{2,3})\s*(Men|Women)?$/i,
  // Numeric sizes with "number" suffix (e.g., "8number", "12number")
  /^(\d{1,3})number$/i,
  // Volume sizes
  /^(\d+)\s*(ml|g|kg|oz|l|pcs)$/i,
  // One Size
  /^One\s*Size$/i,
];

function looksLikeSize(str: string): boolean {
  return SIZE_PATTERNS.some(pattern => pattern.test(str.trim()));
}

function extractColor(combined: string): string {
  if (!combined || combined === 'Default') return 'Default';
  
  const firstDash = combined.indexOf('-');
  const lastDash = combined.lastIndexOf('-');
  
  if (lastDash > 0) {
    const possibleSize = combined.substring(lastDash + 1);
    if (looksLikeSize(possibleSize)) {
      // Multi-dash case: first segment is the color
      if (firstDash !== lastDash && firstDash > 0) {
        const firstSegment = combined.substring(0, firstDash);
        if (!looksLikeSize(firstSegment)) {
          return firstSegment;
        }
      }
      return combined.substring(0, lastDash);
    }
  }
  return combined;
}

function extractSize(combined: string): string {
  if (!combined || combined === 'Default') return '';
  
  const firstDash = combined.indexOf('-');
  const lastDash = combined.lastIndexOf('-');
  
  if (lastDash > 0) {
    const possibleSize = combined.substring(lastDash + 1);
    if (looksLikeSize(possibleSize)) {
      // Multi-dash case: everything after first dash is the size
      if (firstDash !== lastDash && firstDash > 0) {
        const firstSegment = combined.substring(0, firstDash);
        if (!looksLikeSize(firstSegment)) {
          return combined.substring(firstDash + 1);
        }
      }
      return possibleSize;
    }
  }
  return '';
}

async function main() {
  console.log('🔍 Fetching all variants...');
  const variants = await prisma.variant.findMany({
    select: { id: true, cjId: true, color: true, size: true },
  });

  console.log(`📦 Found ${variants.length} variants to check.`);

  let updated = 0;
  let skipped = 0;

  for (const v of variants) {
    // Skip temp/default variants
    if (v.cjId.startsWith('TEMP-VID-') || v.cjId.endsWith('-default')) {
      skipped++;
      continue;
    }

    const oldColor = v.color || '';
    const oldSize = v.size || '';

    // Try to parse from the color field first (format: "ColorName-Size")
    const newColor = extractColor(oldColor);
    const newSize = extractSize(oldColor);

    // If size is empty, try parsing from the old size field (which may contain the full name)
    const finalSize = newSize || extractSize(oldSize) || '';

    // Only update if something changed
    if (newColor !== oldColor || (finalSize && finalSize !== oldSize)) {
      await prisma.variant.update({
        where: { id: v.id },
        data: {
          color: newColor,
          size: finalSize || oldSize,
        },
      });
      updated++;
      
      if (updated <= 10) {
        console.log(`  ✓ ${v.cjId}: "${oldColor}" → "${newColor}" | size: "${oldSize}" → "${finalSize || oldSize}"`);
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Done! Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
