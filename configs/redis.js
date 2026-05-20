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

// Check if Redis is available
export const isRedisAvailable = () => {
  return redis !== null && redis.status === 'ready';
};

// Connect to Redis
export const connectRedis = async () => {
  if (!redis) {
    return false;
  }
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.warn('Redis connection check failed:', error.message);
    return false;
  }
};

export default redis;