import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const product = await prisma.product.create({
      data: {
        cjId: 'TEST-NESTED-002',
        name: 'Test Nested Create 2',
        images: [],
        status: 'ACTIVE',
        variantCount: 1,
        totalStock: 0,
        variants: {
          create: {
            cjId: 'TEST-NESTED-002-default',
            sku: 'TEST-NESTED-SKU-2',
            weight: 200.0,
            baseCost: 15.99,
            sellingPrice: 15.99,
            inventory: 0,
          }
        }
      },
      include: { variants: true }
    });
    console.log('Product created:', product.id);
    console.log('Variants count:', product.variants.length);
    if (product.variants.length > 0) {
      console.log('Variant SKU:', product.variants[0].sku, 'Price:', product.variants[0].baseCost);
    }
    
    // Cleanup
    await prisma.variant.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
    console.log('Cleanup done');
  } catch (e: any) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack?.split('\n').slice(0, 5).join('\n'));
  } finally {
    await prisma.$disconnect();
  }
}
main();
