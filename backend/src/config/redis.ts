import { createClient } from 'redis';

// Redis client instance
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Connect to Redis
 */
export const connectRedis = async (): Promise<void> => {
  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.warn('⚠️  REDIS_URL not configured - caching disabled');
      return;
    }

    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('🔄 Redis: Connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis: Connected and ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis: Reconnecting...');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    redisClient = null;
  }
};

/**
 * Disconnect from Redis
 */
export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      console.log('✅ Redis: Disconnected');
    }
  } catch (error) {
    console.error('❌ Redis disconnect error:', error);
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = () => redisClient;

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!redisClient || !redisClient.isOpen) return null;
      
      const data = await redisClient.get(key);
      return data ? JSON.parse(data as string) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    try {
      if (!redisClient || !redisClient.isOpen) return false;
      
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      if (!redisClient || !redisClient.isOpen) return false;
      
      const result = await redisClient.del(key);
      return Number(result) > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      if (!redisClient || !redisClient.isOpen) return 0;
      
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await redisClient.del(keys);
      return Number(result);
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!redisClient || !redisClient.isOpen) return false;
      
      const result = await redisClient.exists(key);
      return Number(result) > 0;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!redisClient || !redisClient.isOpen) return -1;
      
      const result = await redisClient.ttl(key);
      return Number(result);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  },

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    try {
      if (!redisClient || !redisClient.isOpen) return 0;
      
      const result = await redisClient.incr(key);
      return Number(result);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  },

  /**
   * Decrement value
   */
  async decr(key: string): Promise<number> {
    try {
      if (!redisClient || !redisClient.isOpen) return 0;
      
      const result = await redisClient.decr(key);
      return Number(result);
    } catch (error) {
      console.error('Cache decrement error:', error);
      return 0;
    }
  },
};
