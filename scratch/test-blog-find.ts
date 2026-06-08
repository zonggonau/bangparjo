import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: 'test', published: true },
    });
    console.log('Success:', post);
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
