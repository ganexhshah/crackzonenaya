import { Request, Response, NextFunction } from 'express';
import { cache } from '../config/redis';

/**
 * Cache middleware - caches GET requests
 * @param ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param keyPrefix - Prefix for cache key (default: 'cache')
 */
export const cacheMiddleware = (ttl: number = 300, keyPrefix: string = 'cache') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key from URL and query params
      const cacheKey = `${keyPrefix}:${req.originalUrl || req.url}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (data: any) {
        // Cache the response
        cache.set(cacheKey, data, ttl).catch((err) => {
          console.error('Failed to cache response:', err);
        });

        // Call original json function
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

/**
 * Invalidate cache by pattern
 * @param pattern - Redis key pattern (e.g., 'teams:*')
 */
export const invalidateCache = async (pattern: string): Promise<number> => {
  try {
    const deletedCount = await cache.delPattern(pattern);
    console.log(`🗑️  Invalidated ${deletedCount} cache entries matching: ${pattern}`);
    return deletedCount;
  } catch (error) {
    console.error('Failed to invalidate cache:', error);
    return 0;
  }
};

/**
 * Invalidate specific cache key
 * @param key - Redis key
 */
export const invalidateCacheKey = async (key: string): Promise<boolean> => {
  try {
    const deleted = await cache.del(key);
    if (deleted) {
      console.log(`🗑️  Invalidated cache key: ${key}`);
    }
    return deleted;
  } catch (error) {
    console.error('Failed to invalidate cache key:', error);
    return false;
  }
};
