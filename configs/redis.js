import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || "localhost:6379";

const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })
  : null;

if (redis) {
  redis.on('connect', () => {
    console.log('✓ Redis connected');
  });

  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
  });
}

export default redis;