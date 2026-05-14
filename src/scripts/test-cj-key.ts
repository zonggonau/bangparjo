/**
 * Test CJ Dropshipping API Key
 * Jalanin: npx tsx src/scripts/test-cj-key.ts <API_KEY>
 * Contoh:  npx tsx src/scripts/test-cj-key.ts "CJ123456@api@xxxxxxxx..."
 */
import 'dotenv/config';

const apiKey = process.argv[2] || process.env.CJ_API_KEY;

if (!apiKey || apiKey === 'your_cj_api_key' || apiKey.includes('…')) {
  console.log('❌ API Key tidak valid atau belum diisi.');
  console.log('Cara pakai: npx tsx src/scripts/test-cj-key.ts "CJnomor@api@xxxxxx"');
  process.exit(1);
}

async function test() {
  console.log('🔍 Testing CJ API Key...');
  console.log(`Key: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 6)}`);

  const baseUrl = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0';

  // Test 1: Get Access Token
  console.log('\n1️⃣  Get Access Token...');
  try {
    const res = await fetch(`${baseUrl}/v1/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    const data = await res.json();

    if (data.success && data.data?.accessToken) {
      console.log(`   ✅ Token didapatkan!`);
      console.log(`   Token: ${data.data.accessToken.substring(0, 20)}...`);
      console.log(`   Refresh: ${data.data.refreshToken?.substring(0, 20) || 'N/A'}...`);
    } else {
      console.log(`   ❌ Gagal: ${data.message || JSON.stringify(data)}`);
      console.log(`\n   🔑 Pastikan API Key benar. Format: CJnomor@api@xxxxxxxxx`);
      console.log(`   📝 Dapatkan API Key di: https://seller.cjdropshipping.com → Settings → API`);
      process.exit(1);
    }
  } catch (err: any) {
    console.log(`   ❌ Network error: ${err.message}`);
    process.exit(1);
  }

  // Test 2: Get Categories (read-only, safe)
  console.log('\n2️⃣  Get Categories...');
  try {
    const res = await fetch(`${baseUrl}/v1/product/getCategory`, {
      headers: { 'CJ-Access-Token': (await getToken(apiKey, baseUrl)) },
    });
    const data = await res.json();
    if (data.success) {
      const cats = data.data || [];
      console.log(`   ✅ ${cats.length} kategori ditemukan!`);
      cats.slice(0, 5).forEach((c: any) => console.log(`      - ${c.categoryFirstName}`));
    } else {
      console.log(`   ⚠️  ${data.message}`);
    }
  } catch (err: any) {
    console.log(`   ❌ ${err.message}`);
  }

  // Test 3: Get Products (minimal)
  console.log('\n3️⃣  Get Product List...');
  try {
    const token = await getToken(apiKey, baseUrl);
    const res = await fetch(`${baseUrl}/v1/product/list?pageNum=1&pageSize=3`, {
      headers: { 'CJ-Access-Token': token },
    });
    const data = await res.json();
    if (data.success) {
      console.log(`   ✅ ${data.data?.list?.length || 0} produk ditemukan!`);
      (data.data?.list || []).slice(0, 3).forEach((p: any) => 
        console.log(`      - ${p.pid}: ${p.productNameEn}`));
    } else {
      console.log(`   ⚠️  ${data.message}`);
    }
  } catch (err: any) {
    console.log(`   ❌ ${err.message}`);
  }

  console.log('\n✅ Test selesai!');
}

async function getToken(key: string, base: string): Promise<string> {
  const res = await fetch(`${base}/v1/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: key }),
  });
  const data = await res.json();
  return data.data.accessToken;
}

test().catch(console.error);
