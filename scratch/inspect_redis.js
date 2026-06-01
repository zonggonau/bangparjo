const Redis = require('ioredis');

async function main() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log('Connecting to Redis at:', redisUrl);
  
  const redis = new Redis(redisUrl);
  
  const slug = 'portable-high-pressure-washing-water-gun-car-wash-nozzle-adjustable-nipple-type-direct-spray-home-garden-shower-watering-hose-2603240651381611900-id';
  const cacheKey = 'blog:post:' + slug;
  
  const cachedVal = await redis.get(cacheKey);
  if (cachedVal) {
    console.log('--- FOUND IN REDIS CACHE ---');
    try {
      const post = JSON.parse(cachedVal);
      console.log('Post Title:', post.title);
      console.log('Post Slug:', post.slug);
      
      const contentData = JSON.parse(post.content);
      console.log('Product Name:', contentData.name);
      console.log('Product Variants Count:', contentData.variants?.length);
      console.log('First Variant baseCost:', contentData.variants?.[0]?.baseCost);
      console.log('First Variant sellingPrice:', contentData.variants?.[0]?.sellingPrice);
      contentData.variants?.slice(0, 5).forEach(v => {
        console.log(`  - Variant SKU: ${v.sku}, BaseCost: ${v.baseCost}, SellingPrice: ${v.sellingPrice}`);
      });
    } catch (e) {
      console.log('Failed to parse cached JSON:', e.message);
      console.log('Raw cachedVal snippet:', cachedVal.substring(0, 1000));
    }
  } else {
    console.log('Key not found in Redis:', cacheKey);
  }

  // Also let's scan all keys in redis starting with blog:post:
  console.log('Scanning Redis for blog:post:* keys...');
  const keys = await redis.keys('blog:post:*');
  console.log('Found keys:', keys);

  await redis.disconnect();
}

main().catch(console.error);
