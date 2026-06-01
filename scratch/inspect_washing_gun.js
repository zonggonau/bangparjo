require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const blogPostCount = await prisma.blogPost.count();
  const productCount = await prisma.product.count();
  const variantCount = await prisma.variant.count();
  const storeSettingCount = await prisma.storeSetting.count();
  const marginTierCount = await prisma.marginTier.count();

  console.log('--- DATABASE TABLES COUNTS ---');
  console.log('BlogPost:', blogPostCount);
  console.log('Product:', productCount);
  console.log('Variant:', variantCount);
  console.log('StoreSetting:', storeSettingCount);
  console.log('MarginTier:', marginTierCount);

  if (blogPostCount > 0) {
    const posts = await prisma.blogPost.findMany({
      select: { id: true, slug: true, title: true, published: true }
    });
    console.log('\n--- ALL BLOG POST SLUGS ---');
    posts.forEach(p => {
      console.log(`- Slug: ${p.slug} | Published: ${p.published} | Title: ${p.title}`);
    });

    const partialSlug = 'portable-high-pressure';
    const matched = posts.find(p => p.slug.includes(partialSlug));
    if (matched) {
      console.log('\n--- MATCHED POST ---');
      const post = await prisma.blogPost.findUnique({
        where: { id: matched.id }
      });
      try {
        const data = JSON.parse(post.content);
        console.log('Product Name:', data.name);
        console.log('First Variant baseCost:', data.variants?.[0]?.baseCost);
        console.log('First Variant sellingPrice:', data.variants?.[0]?.sellingPrice);
        data.variants?.slice(0, 5).forEach(v => {
          console.log(`  - Variant: color=${v.color}, size=${v.size}, BaseCost=${v.baseCost}, SellingPrice=${v.sellingPrice}`);
        });
      } catch (e) {
        console.log('Content is not JSON:', e.message);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
