import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Cari blog post yang content-nya JSON product
    const posts = await prisma.blogPost.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    for (const post of posts) {
      console.log('=== Post:', post.slug);
      console.log('Title:', post.title);
      console.log('Image (DB column):', post.image);
      
      // Parse content
      try {
        const content = JSON.parse(post.content);
        if (content.type === 'product') {
          const contentImg0 = content.images?.[0] || '(no images in content)';
          const match = post.image === contentImg0;
          console.log('Content images[0]:', contentImg0);
          console.log('MATCH:', match ? 'YES ✓' : 'NO ✗ - BERBEDA!');
          
          if (!match && post.image) {
            console.log('  >>> GAMBAR TIDAK SESUAI ANTARA DB COLUMN DAN CONTENT!');
            console.log('  >>> DB column:', post.image);
            console.log('  >>> Content:', contentImg0);
          }
        } else {
          console.log('Content type:', content.type || '(not product)');
        }
      } catch {
        console.log('Content: raw HTML');
      }
      console.log('');
    }

    await prisma.$disconnect();
  } catch (err: any) {
    console.error('Error:', err.message);
    await prisma.$disconnect();
  }
}

main();
