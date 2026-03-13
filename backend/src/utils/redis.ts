import Redis from 'ioredis';

let redis: Redis | null = null;

export const initRedis = () => {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log(`📡 Connecting to Redis at ${redisUrl}...`);

  redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
      // Retry every 2 seconds, forever but without hammering
      return 2000;
    },
    maxRetriesPerRequest: null, // Critical for not crashing on startup or temporary drops
    enableOfflineQueue: true,
    connectTimeout: 10000,
  });

  redis.on('error', (err) => {
    // Log but don't crash
    console.error('❌ Redis Connection Error:', err.message);
  });

  redis.on('connect', () => {
    console.log('✅ Connected to Redis');
  });

  redis.on('reconnecting', () => {
    console.log('🔄 Reconnecting to Redis...');
  });

  return redis;
};

export const getRedis = (): Redis => {
  if (!redis) {
    return initRedis();
  }
  return redis;
};

export const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};

// Cache keys
export const getFlagCacheKey = (environmentId: string, flagKey: string) => 
  `flag:${environmentId}:${flagKey}`;

export const getAllFlagsCacheKey = (environmentId: string) => 
  `flags:${environmentId}:all`;

export const invalidateFlagCache = async (environmentId: string, flagKey?: string) => {
  try {
    const client = getRedis();
    const pipeline = client.pipeline();
    
    if (flagKey) {
      pipeline.del(getFlagCacheKey(environmentId, flagKey));
    }
    
    pipeline.del(getAllFlagsCacheKey(environmentId));
    
    // Also clear a potential wildcard matches just in case
    if (flagKey) {
      // This is a bit safer for some environments
      const keys = await client.keys(`flag:${environmentId}:*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    }

    await pipeline.exec();
  } catch (err) {
    console.error('Failed to invalidate Redis cache:', err);
    // Don't throw, we want the DB operation to succeed even if cache fails
  }
};
