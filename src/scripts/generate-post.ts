/**
 * Generate Sosial Media Post untuk Produk CJ
 * Jalanin: npx tsx src/scripts/generate-post.ts <CJ_PRODUCT_ID>
 * Contoh:  npx tsx src/scripts/generate-post.ts 2050034562827591682
 * 
 * Hasil: Output siap copy-paste ke FB, IG, Twitter
 */
import 'dotenv/config';
import { getProductDetails } from '@/lib/cj-api';

const productId = process.argv[2];
if (!productId) {
  console.log('Cara pakai: npx tsx src/scripts/generate-post.ts <PRODUCT_ID>');
  console.log('Cari product ID dari CJ Dashboard atau hasil sync');
  process.exit(1);
}

async function generate() {
  console.log(`🔍 Generating post untuk produk: ${productId}\n`);
  
  const res = await getProductDetails(productId);
  if (!res.success || !res.data) {
    console.log(`❌ Gagal ambil produk: ${res.message}`);
    process.exit(1);
  }

  const p = res.data;
  const price = p.variants?.[0]?.variantSellPrice || p.sellPrice || 0;
  const priceIDR = Math.round(price * 16500);
  const checkoutUrl = `https://bangparjo.shop/checkout?pid=${p.pid}&vid=${p.variants?.[0]?.vid || ''}`;

  const post = {
    facebook: `🛒 **PRODUK TERBARU** 🛒\n\n${p.productNameEn}\n\n💰 Harga: $${price} (~Rp ${priceIDR.toLocaleString('id-ID')})\n🚚 FREE Shipping Worldwide!\n✅ Produk Original — Dropship Langsung dari Supplier\n\n🔗 ORDER SEKARANG: ${checkoutUrl}\n\n#Dropship #BangParjo #BelanjaOnline #GlobalShipping`,

    instagram: `✨ NEW ARRIVAL ✨\n\n${p.productNameEn}\n\n💰 $${price} | Rp ${priceIDR.toLocaleString('id-ID')}\n🌍 Free Shipping Worldwide\n✅ Original Product\n\n👇 ORDER LINK IN BIO\n🔗 bangparjo.shop/checkout?pid=${p.pid}`,

    twitter: `🛍️ ${p.productNameEn}\n💰 $${price} (~Rp ${priceIDR.toLocaleString('id-ID')})\n🚚 FREE Shipping\n\nOrder: ${checkoutUrl}`,

    google_ads: {
      headline: `${p.productNameEn} — Hanya $${price}`,
      description: `Dapatkan ${p.productNameEn} dengan harga terbaik. FREE Shipping Worldwide. Original Product. Pesan sekarang!`,
      final_url: checkoutUrl,
    }
  };

  console.log('='.repeat(60));
  console.log('📘 FACEBOOK');
  console.log('='.repeat(60));
  console.log(post.facebook);
  
  console.log('\n' + '='.repeat(60));
  console.log('📸 INSTAGRAM');
  console.log('='.repeat(60));
  console.log(post.instagram);

  console.log('\n' + '='.repeat(60));
  console.log('🐦 TWITTER / X');
  console.log('='.repeat(60));
  console.log(post.twitter);

  console.log('\n' + '='.repeat(60));
  console.log('🔍 GOOGLE ADS');
  console.log('='.repeat(60));
  console.log(`Headline: ${post.google_ads.headline}`);
  console.log(`Deskripsi: ${post.google_ads.description}`);
  console.log(`URL: ${post.google_ads.final_url}`);

  // Image
  if (p.productImage) {
    console.log('\n📷 GAMBAR PRODUK:');
    console.log(p.productImage);
  }
}

generate();
