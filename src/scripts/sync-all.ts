/**
 * Sync All — CJ Products → Database
 * Jalanin setelah API Key bener:
 *   npx tsx src/scripts/sync-all.ts
 * 
 * Proses:
 * 1. Sync kategori
 * 2. Import trending products (top 50)
 * 3. Update inventory
 */
import 'dotenv/config';
import { prisma } from '@/lib/db';
import { syncAllCategories, syncTrendingProducts } from '@/lib/sync-logic';

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🚀 CJ DATA SYNCHRONIZATION START (CLI)');
  console.log('='.repeat(50));

  try {
    const cats = await syncAllCategories();
    console.log(`✅ ${cats} kategori tersimpan.`);
    
    await sleep(3000);
    
    const prods = await syncTrendingProducts(3); // Sync 3 pages
    console.log(`\n✅ ${prods} produk berhasil di-import!`);
    
    console.log('\n🎉 SEMUA SELESAI! Produk sekarang tampil di website.');
  } catch (err: any) {
    console.error('\n❌ Fatal error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 CJ DATA SYNCHRONIZATION START');
  console.log('='.repeat(50));

  try {
    await syncCategories();
    await sleep(3000);
    await syncProducts();
    console.log('\n🎉 SEMUA SELESAI! Produk sekarang tampil di website.');
  } catch (err: any) {
    console.error('\n❌ Fatal error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
