/**
 * Import Categories from CJ Dropshipping API to Local Database
 * 
 * Run: npx tsx scripts/import-categories.ts
 * 
 * CJ API returns categories in this format:
 * [
 *   { categoryFirstId, categoryFirstName, categoryFirstList: [
 *     { categorySecondId, categorySecondName, categorySecondList: [
 *       { categoryId, categoryName }
 *     ]}
 *   ]}
 * ]
 */

import { prisma } from '../src/lib/db';
import { slugify } from '../src/lib/utils';

// ── Typing ───────────────────────────────────────────────────────────────
interface CJLevel1 {
  categoryFirstId: string;
  categoryFirstName: string;
  categoryFirstList: CJLevel2[];
}

interface CJLevel2 {
  categorySecondId: string;
  categorySecondName: string;
  categorySecondList: CJLevel3[];
}

interface CJLevel3 {
  categoryId: string;
  categoryName: string;
}

// ── Helper ───────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function makeUniqueSlug(name: string, id: string): string {
  // Use the full ID appended to the slug to guarantee uniqueness
  const base = slugify(name);
  const idShort = id.replace(/-/g, '').toLowerCase().slice(0, 12);
  return base + '-' + idShort;
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔄 Fetching categories from CJ API...');

  // Import CJ API functions
  const { getCategories } = await import('../src/lib/cj-api');
  const result = await getCategories();

  if (!result.success || !result.data) {
    console.error('❌ Failed to fetch categories:', result.message || 'No data');
    return;
  }

  const rawData = result.data;
  
  let categories: CJLevel1[];

  if (Array.isArray(rawData)) {
    categories = rawData as CJLevel1[];
  } else {
    console.error('❌ Unexpected data format');
    console.log('Raw:', JSON.stringify(rawData).slice(0, 500));
    return;
  }

  console.log(`📦 Found ${categories.length} top-level categories`);
  let totalImported = 0;

  for (const l1 of categories) {
    if (!l1.categoryFirstId || !l1.categoryFirstName) {
      console.warn(`⚠️ Skipping level-1 with missing data`);
      continue;
    }

    const l1Slug = makeUniqueSlug(l1.categoryFirstName, l1.categoryFirstId);
    console.log(`\n📁 L1: ${l1.categoryFirstName} (${l1.categoryFirstId})`);

    // Insert level 1
    const l1Db = await prisma.category.upsert({
      where: { cjId: l1.categoryFirstId },
      update: { name: l1.categoryFirstName, slug: l1Slug, parentId: null },
      create: { cjId: l1.categoryFirstId, name: l1.categoryFirstName, slug: l1Slug, parentId: null },
    });
    totalImported++;

    if (!l1.categoryFirstList?.length) continue;

    for (const l2 of l1.categoryFirstList) {
      if (!l2.categorySecondId || !l2.categorySecondName) continue;

      const l2Slug = makeUniqueSlug(l2.categorySecondName, l2.categorySecondId);
      console.log(`  📁 L2: ${l2.categorySecondName} (${l2.categorySecondId})`);

      // Insert level 2
      const l2Db = await prisma.category.upsert({
        where: { cjId: l2.categorySecondId },
        update: { name: l2.categorySecondName, slug: l2Slug, parentId: l1Db.id },
        create: { cjId: l2.categorySecondId, name: l2.categorySecondName, slug: l2Slug, parentId: l1Db.id },
      });
      totalImported++;

      if (!l2.categorySecondList?.length) continue;

      for (const l3 of l2.categorySecondList) {
        if (!l3.categoryId || !l3.categoryName) continue;

        const l3Slug = makeUniqueSlug(l3.categoryName, l3.categoryId);

        // Insert level 3
        await prisma.category.upsert({
          where: { cjId: l3.categoryId },
          update: { name: l3.categoryName, slug: l3Slug, parentId: l2Db.id },
          create: { cjId: l3.categoryId, name: l3.categoryName, slug: l3Slug, parentId: l2Db.id },
        });
        totalImported++;

        // Rate limiting
        await sleep(150);
      }
    }
  }

  console.log(`\n✅ Done! Imported ${totalImported} categories into database.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
