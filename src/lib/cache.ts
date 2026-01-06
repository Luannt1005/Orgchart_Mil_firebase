/**
 * Simple In-Memory Server-Side Cache
 * Used to reduce Firebase Read costs for frequently accessed data
 */

type CacheEntry<T> = {
    data: T;
    timestamp: number;
};

const cache = new Map<string, CacheEntry<any>>();

// Default TTL: 5 minutes (300,000 ms)
const DEFAULT_TTL = 300000;

export async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = DEFAULT_TTL
): Promise<T> {
    const now = Date.now();
    const entry = cache.get(key);

    if (entry && (now - entry.timestamp < ttl)) {
        console.log(`[Cache] HIT for key: ${key}`);
        return entry.data;
    }

    console.log(`[Cache] MISS for key: ${key}. Fetching fresh data...`);
    const freshData = await fetcher();
    cache.set(key, { data: freshData, timestamp: now });
    return freshData;
}

export function invalidateCache(key: string) {
    cache.delete(key);
    console.log(`[Cache] Invalidated key: ${key}`);
}

export function invalidateCachePrefix(prefix: string) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
    console.log(`[Cache] Invalidated keys with prefix: ${prefix}`);
}

/**
 * Generate a cache key for paginated data
 */
export function getPaginatedCacheKey(prefix: string, page: number, limit: number): string {
    return `${prefix}_page_${page}_limit_${limit}`;
}

/**
 * Get count of cached pages for a prefix
 */
export function getCachedPagesCount(prefix: string): number {
    let count = 0;
    for (const key of cache.keys()) {
        if (key.startsWith(prefix + '_page_')) count++;
    }
    return count;
}

/**
 * Check if a specific page is cached
 */
export function isPageCached(prefix: string, page: number, limit: number): boolean {
    const key = getPaginatedCacheKey(prefix, page, limit);
    const entry = cache.get(key);
    if (!entry) return false;
    const now = Date.now();
    return (now - entry.timestamp) < DEFAULT_TTL;
}

/**
 * Get all cached pages data combined (for filtering scenarios)
 */
export function getAllCachedPagesData<T>(prefix: string): T[] {
    const allData: T[] = [];
    for (const [key, entry] of cache.entries()) {
        if (key.startsWith(prefix + '_page_') && entry.data?.data) {
            allData.push(...entry.data.data);
        }
    }
    return allData;
}
