import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const pid = '1767475018784583680';
  
  // Cek product di DB
  const product = await prisma.product.findUnique({
    where: { cjId: pid },
    include: { variants: true }
  });
  
  if (product) {
    console.log('=== PRODUCT FROM DB ===');
    console.log('Name:', product.name);
    console.log('Images count:', product.images?.length);
    
    // Cek sellingPrice di product
    console.log('sellPrice (product):', (product as any).sellPrice);
    
    // Cek variants
    console.log('\n=== VARIANTS FROM DB (first 3) ===');
    for (const v of product.variants.slice(0, 3)) {
      console.log(`  ${v.cjId}: baseCost=${v.baseCost}, sellingPrice=${v.sellingPrice}, color=${v.color}`);
    }
    
    // Cek apakah ada field lain yang mungkin berisi harga
    console.log('\n=== ALL FIELDS OF PRODUCT ===');
    for (const [key, val] of Object.entries(product)) {
      if (typeof val === 'number' || typeof val === 'string') {
        console.log(`  ${key}: ${val}`);
      }
    }
    
    // Cek apakah ada field sellPrice atau price di product
    console.log('\n=== PRODUCT KEYS ===');
    console.log(Object.keys(product).join(', '));
  }
  
  // Cek blog post
  const blogPosts = await prisma.blogPost.findMany({
    where: { content: { contains: pid } }
  });
  
  for (const post of blogPosts) {
    try {
      const parsed = JSON.parse(post.content);
      if (parsed.type === 'product') {
        // Cek apakah sellingPrice di blog post berbeda dari DB
        console.log('\n=== BLOG POST VARIANTS (first 3) ===');
        for (const v of parsed.variants.slice(0, 3)) {
          console.log(`  ${v.cjId}: baseCost=${v.baseCost}, sellingPrice=${v.sellingPrice}`);
        }
        
        // Cek apakah ada field price atau sellPrice di level product
        console.log('\n=== BLOG POST PRODUCT FIELDS ===');
        for (const [key, val] of Object.entries(parsed)) {
          if (typeof val === 'number' || typeof val === 'string') {
            console.log(`  ${key}: ${val}`);
          }
        }
      }
    } catch (e) {}
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
