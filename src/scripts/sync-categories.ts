import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getCategories } from '../lib/cj-api';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function syncCategories() {
  console.log('🚀 Starting category synchronization from global supplier...');

  try {
    const response = await getCategories();

    if (!response.success) {
      throw new Error(`Failed to fetch categories: ${response.message}`);
    }

    const categories = response.data as any[];
    console.log(`📦 Found ${categories.length} main categories.`);

    let count = 0;

    for (const cat of categories) {
      const catId = cat.categoryFirstId;
      if (!catId) {
        console.warn('⚠️ Skipping category without ID:', cat.categoryFirstName);
        continue;
      }
      // 1. Upsert Main Category (Level 1)
      const catName = cat.categoryFirstName || 'Unknown Category';
      const level1 = await prisma.category.upsert({
        where: { cjId: catId },
        update: { name: catName },
        create: {
          cjId: catId,
          name: catName,
          slug: slugify(catName, { lower: true }) + '-' + catId,
        },
      });
      count++;

      // 2. Check Sub-Categories (Level 2)
      const level2List = cat.categoryFirstList || [];
      if (Array.isArray(level2List)) {
        for (const sub of level2List) {
          const subId = sub.categorySecondId;
          if (!subId) continue;
          
          const subName = sub.categorySecondName || 'Unknown Subcategory';
          const level2 = await prisma.category.upsert({
            where: { cjId: subId },
            update: { name: subName },
            create: {
              cjId: subId,
              name: subName,
              slug: slugify(subName, { lower: true }) + '-' + subId,
              parentId: level1.id,
            },
          });
          count++;

          // 3. Check Sub-Sub-Categories (Level 3)
          const level3List = sub.categorySecondList || [];
          if (Array.isArray(level3List)) {
            for (const subSub of level3List) {
              const subSubId = subSub.categoryId;
              if (!subSubId) continue;

              const subSubName = subSub.categoryName || 'Unknown Sub-Subcategory';
              await prisma.category.upsert({
                where: { cjId: subSubId },
                update: { name: subSubName },
                create: {
                  cjId: subSubId,
                  name: subSubName,
                  slug: slugify(subSubName, { lower: true }) + '-' + subSubId,
                  parentId: level2.id,
                },
              });
              count++;
            }
          }
        }
      }
    }

    console.log(`✅ Synchronization complete! Total ${count} categories saved/updated.`);
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncCategories();
