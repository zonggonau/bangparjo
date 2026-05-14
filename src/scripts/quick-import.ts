import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0';
const KEY = process.env.CJ_API_KEY!;

async function getToken() {
  const r = await fetch(BASE + '/v1/authentication/getAccessToken', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({apiKey: KEY})
  });
  const d = await r.json();
  return d.data.accessToken;
}

async function importProducts() {
  console.log('🚀 Import produk trending...');
  const token = await getToken();

  // Get trending products
  const res = await fetch(BASE + '/v1/product/list?pageNum=1&pageSize=5&searchType=2', {
    headers: {'CJ-Access-Token': token}
  });
  const data = await res.json();
  if (!data.success || !data.data?.list?.length) {
    console.log('Tidak ada produk');
    return;
  }

  for (const p of data.data.list) {
    console.log('\n📦 ' + p.productNameEn);

    // Get detail
    const dr = await fetch(BASE + '/v1/product/query?pid=' + p.pid, {
      headers: {'CJ-Access-Token': token}
    });
    const detail = await dr.json();
    if (!detail.success || !detail.data) continue;

    const d = detail.data;

    // Cek apakah produk sudah ada
    const existing = await prisma.product.findUnique({ where: { cjId: d.pid } });
    if (existing) {
      console.log('   Already exists: ' + existing.id);
      continue;
    }

    // Buat produk
    const product = await prisma.product.create({
      data: {
        cjId: d.pid,
        name: d.productNameEn || d.productName || 'Unknown',
        description: d.description || '',
        images: d.productImage ? [d.productImage] : [],
        variantCount: d.variants?.length || 0,
        totalStock: d.variants?.reduce((a: number, v: any) => a + (v.inventory || 0), 0) || 0,
      }
    });
    console.log('   ✅ Created: ' + product.id);

    // Buat variants
    if (d.variants?.length) {
      for (const v of d.variants) {
        try {
          await prisma.variant.create({
            data: {
              productId: product.id,
              cjId: v.vid,
              sku: v.variantSku,
              color: v.variantKey || '',
              size: v.variantNameEn || '',
              weight: v.variantWeight || 0,
              baseCost: v.variantSellPrice || 0,
              sellingPrice: (v.variantSellPrice || 0) * 1.3,
              inventory: v.inventory || 0,
              image: v.variantImage || d.productImage,
            }
          });
        } catch(e: any) {
          console.log('   ⚠️ Variant error: ' + e.message);
        }
      }
      console.log('   ✅ ' + d.variants.length + ' variants');
    }

    await new Promise(r => setTimeout(r, 2500));
  }

  await prisma.$disconnect();
  console.log('\n✅ Selesai!');
}

importProducts().catch(console.error);
