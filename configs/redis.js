import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST;
const redisPort = Number.parseInt(process.env.REDIS_PORT ?? '6379', 10);
const redisConnectTimeout = Number.parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS ?? '5000', 10);
const useTls = process.env.REDIS_TLS === 'true' || redisHost?.includes('serverless');
const redisEnabled = Boolean(redisHost && Number.isFinite(redisPort));

let redisReady = false;
let redisClient = null;
let redisConnectPromise = null;
let redisFailureLogged = false;

if (redisEnabled) {
  const redisConfig = {
    host: redisHost,
    port: redisPort,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: redisConnectTimeout,
    ...(useTls ? { tls: {} } : {}),

    retryStrategy(times) {
      if (times >= 3) {
        return null;
      }

      return Math.min(200 * 2 ** (times - 1), 2000);
    },

    reconnectOnError(err) {
      return err.message.includes('READONLY');
    },
  };

  console.log(`Redis Config: Host=${redisConfig.host}:${redisConfig.port}`);

  redisClient = new Redis(redisConfig);

  const markRedisUnavailable = (message) => {
    redisReady = false;
    if (!redisFailureLogged) {
      redisFailureLogged = true;
      console.warn(`⚠ Redis unavailable: ${message}`);
    }
  };

  redisClient.on('connect', () => {
    console.log('✓ Redis connected successfully');
  });

  redisClient.on('ready', () => {
    redisReady = true;
    redisFailureLogged = false;
    console.log('✓ Redis is ready to accept commands');
  });

  redisClient.on('error', (err) => {
    markRedisUnavailable(err.message);
  });

  redisClient.on('reconnecting', () => {
    redisReady = false;
    console.warn('⚠ Redis reconnecting...');
  });

  redisClient.on('end', () => {
    redisReady = false;
    console.log('⚠ Redis connection closed');
  });
}

export const isRedisAvailable = () => redisReady;

export const connectRedis = async () => {
  if (!redisClient) {
    return false;
  }

  if (redisReady) {
    return true;
  }

  if (!redisConnectPromise) {
    redisConnectPromise = redisClient
      .connect()
      .then(() => {
        redisReady = true;
        redisFailureLogged = false;
        return true;
      })
      .catch((err) => {
        redisReady = false;
        if (!redisFailureLogged) {
          redisFailureLogged = true;
          console.warn(`⚠ Redis unavailable: ${err.message}`);
        }
        return false;
      })
      .finally(() => {
        redisConnectPromise = null;
      });
  }

  return redisConnectPromise;
};

export default redisClient;