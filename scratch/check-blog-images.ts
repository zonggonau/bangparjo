import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const posts = await prisma.blogPost.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { 
        slug: true, 
        title: true, 
        image: true,
        content: true,
      }
    });

    for (const post of posts) {
      console.log('=== Post:', post.slug);
      console.log('Title:', post.title);
      console.log('Image (DB):', post.image);
      
      // Parse content to get images
      try {
        const content = JSON.parse(post.content);
        if (content.type === 'product') {
          console.log('Content images:', JSON.stringify(content.images?.slice(0, 3)));
          console.log('Content images[0]:', content.images?.[0]);
        }
      } catch {
        console.log('Content: (raw HTML, not JSON)');
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
