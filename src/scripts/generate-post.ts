/**
 * Generate Social Media Post for CJ Products
 * Run: npx tsx src/scripts/generate-post.ts <CJ_PRODUCT_ID>
 * Example: npx tsx src/scripts/generate-post.ts 2050034562827591682
 * 
 * Output: Ready to copy-paste to FB, IG, Twitter
 */
import 'dotenv/config';
import { getProductDetails } from '@/lib/cj';

const productId = process.argv[2];
if (!productId) {
  console.log('Usage: npx tsx src/scripts/generate-post.ts <PRODUCT_ID>');
  console.log('Find product ID from CJ Dashboard or sync results');
  process.exit(1);
}

async function generate() {
  console.log(`🔍 Generating post for product: ${productId}\n`);
  
  const res = await getProductDetails(productId);
  if (!res.success || !res.data) {
    console.log(`❌ Failed to fetch product: ${res.message}`);
    process.exit(1);
  }

  const p = res.data;
  const price = p.variants?.[0]?.variantSellPrice || p.sellPrice || 0;
  // Build product URL: /product/[cjId]/[slug]?v=[variantId]&color=[color]&size=[size]&price=[price]
  const firstVariant = p.variants?.[0] || {};
  const productSlug = p.productNameEn
    ? p.productNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : p.pid;
  const variantParams = new URLSearchParams();
  if (firstVariant.vid) variantParams.set('v', firstVariant.vid);
  if (firstVariant.color) variantParams.set('color', firstVariant.color);
  if (firstVariant.size) variantParams.set('size', firstVariant.size);
  variantParams.set('price', price.toFixed(2));
  const checkoutUrl = `https://bangparjo.shop/product/${p.pid}/${productSlug}?${variantParams.toString()}`;


  // Generate coupon codes based on product price
  var couponCode = '';
  var couponText = '';
  if (price >= 50) {
    couponCode = 'FREESHIP';
    couponText = '🚚 FREE SHIPPING — Use code: FREESHIP';
  } else if (price >= 20) {
    couponCode = 'SAVE10';
    couponText = '💸 10% OFF — Use code: SAVE10';
  } else {
    couponCode = 'WELCOME5';
    couponText = '🎉 $5 OFF — Use code: WELCOME5';
  }

  const post = {
    facebook: `🛒 **NEW PRODUCT** 🛒\n\n${p.productNameEn}\n\n💰 Price: $${price}\n🚚 Worldwide Shipping\n✅ Original Product — Direct Dropship from Supplier\n${couponText}\n\n🔗 ORDER NOW: ${checkoutUrl}\n\n#Dropship #BangParjo #OnlineShopping #GlobalShipping`,

    instagram: `✨ NEW ARRIVAL ✨\n\n${p.productNameEn}\n\n💰 $${price}\n🌍 Worldwide Shipping\n✅ Original Product\n${couponText}\n\n👇 ORDER LINK IN BIO\n🔗 bangparjo.shop/checkout?pid=${p.pid}`,

    twitter: `🛍️ ${p.productNameEn}\n💰 $${price}\n🚚 Worldwide Shipping\n${couponText}\n\nOrder: ${checkoutUrl}`,

    google_ads: {
      headline: `${p.productNameEn} — Only $${price}`,
      description: `Get ${p.productNameEn} at the best price. ${couponText.replace(/[^a-zA-Z0-9 $%.]/g, '')}. Worldwide Shipping. Order now!`,
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
  console.log(`Description: ${post.google_ads.description}`);
  console.log(`URL: ${post.google_ads.final_url}`);

  // Image
  if (p.productImage) {
    console.log('\n📷 PRODUCT IMAGE:');
    console.log(p.productImage);
  }
}

generate();
