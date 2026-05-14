/**
 * Cari Produk CJ Dropshipping
 * Jalanin: npx tsx src/scripts/search-cj.ts <keyword>
 * Contoh:  npx tsx src/scripts/search-cj.ts smartwatch
 *         npx tsx src/scripts/search-cj.ts --trending
 *         npx tsx src/scripts/search-cj.ts --category electronics
 */
import 'dotenv/config';
import { getProducts, getCategories } from '@/lib/cj-api';

const args = process.argv.slice(2);
const isTrending = args.includes('--trending') || args.includes('-t');
const isCategory = args.includes('--category') || args.includes('-c');
const keyword = args.filter(a => !a.startsWith('-')).join(' ');

async function search() {
  console.log('🔍 CJ Dropshipping — Pencarian Produk\n');

  if (isCategory) {
    // Show categories
    const cats = await getCategories();
    if (cats.success && cats.data) {
      console.log('📂 KATEGORI:\n');
      (cats.data as any[]).slice(0, 20).forEach((c: any) => {
        console.log(`  • ${c.categoryFirstName}`);
        (c.categoryFirstList || []).slice(0, 5).forEach((s: any) => {
          console.log(`      - ${s.categorySecondName}`);
        });
      });
    }
    return;
  }

  const params: any = { pageNum: 1, pageSize: 10 };
  if (keyword) params.keyWord = keyword;
  if (isTrending) params.searchType = 2;

  const res = await getProducts(params);
  
  if (!res.success || !res.data?.list?.length) {
    console.log('❌ Tidak ada produk ditemukan.');
    return;
  }

  const products = res.data.list;
  console.log(`Ditemukan ${res.data.total || products.length} produk (menampilkan ${products.length}):\n`);

  products.forEach((p, i) => {
    const price = p.sellPrice || 0;
    const priceIDR = Math.round(price * 16500);
    const checkoutUrl = `https://bangparjo.shop/checkout?pid=${p.pid}`;
    
    console.log(`${i + 1}. ${p.productNameEn}`);
    console.log(`   ID: ${p.pid} | Harga: $${price} (~Rp${priceIDR.toLocaleString('id-ID')})`);
    console.log(`   Kategori: ${p.categoryName || '-'}`);
    console.log(`   Checkout: ${checkoutUrl}`);
    if (p.productImage) console.log(`   Gambar: ${p.productImage}`);
    console.log('');
  });
}

search();
