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
