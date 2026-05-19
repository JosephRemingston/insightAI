import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

console.log("host" , process.env.REDIS_HOST);
console.log("port" , process.env.REDIS_PORT);
// Support both localhost and production Redis setups
const redisConfig = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),

  tls : {},
  
  // Retry strategy
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    // Stop retrying after 10 attempts
    if (times > 10) {
      console.error('Redis: Max retries reached, giving up');
      return null;
    }
    return delay;
  },
  
  // Reconnection strategy
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // Reconnect on READONLY errors
    }
    return false;
  },
};

// Log Redis configuration (without password)
console.log(`Redis Config: Host=${redisConfig.host}:${redisConfig.port}`);

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('✓ Redis connected successfully');
});

redis.on('ready', () => {
  console.log('✓ Redis is ready to accept commands');
});

redis.on('error', (err) => {
  console.error('✗ Redis connection error:', err.message);
});

redis.on('reconnecting', () => {
  console.warn('⚠ Redis reconnecting...');
});

redis.on('end', () => {
  console.log('⚠ Redis connection closed');
});

export default redis;