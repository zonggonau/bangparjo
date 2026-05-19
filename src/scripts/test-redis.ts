import Redis from 'ioredis';

const redis = new Redis('redis://localhost:6379');

async function test() {
  try {
    await redis.set('test_key', 'Hello Redis!');
    const val = await redis.get('test_key');
    console.log('Redis Connection Test:', val === 'Hello Redis!' ? 'SUCCESS' : 'FAILED');
    process.exit(0);
  } catch (err) {
    console.error('Redis Connection Test ERROR:', err);
    process.exit(1);
  }
}

test();
