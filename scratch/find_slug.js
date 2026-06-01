require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const query = '2603240651381611900';
  
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { cjId: query },
        { name: { contains: 'washing', mode: 'insensitive' } }
      ]
    }
  });
  console.log('Product in DB:', product ? { id: product.id, cjId: product.cjId, name: product.name } : 'None');

  const blogPost = await prisma.blogPost.findFirst({
    where: {
      OR: [
        { slug: { contains: 'washing', mode: 'insensitive' } },
        { slug: { contains: query } },
        { content: { contains: query } }
      ]
    }
  });
  console.log('BlogPost in DB:', blogPost ? { id: blogPost.id, slug: blogPost.slug, title: blogPost.title } : 'None');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
