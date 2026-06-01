import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.blogPost.findMany({ where: { slug: { contains: '1688004084063805440' } } });
  console.log('Found posts:', posts.length);
  for (const p of posts) {
    console.log('Slug:', p.slug);
    console.log('Content (first 800 chars):', p.content?.substring(0, 800));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
