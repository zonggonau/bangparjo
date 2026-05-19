import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis | undefined };

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  connectTimeout: 5000, // 5 seconds
});

// Handle connection errors to prevent unhandled error events
redis.on('error', (err) => {
  console.warn('[Redis Connection Error]:', err.message);
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export default redis;
