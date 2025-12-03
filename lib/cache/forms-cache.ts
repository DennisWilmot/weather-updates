// Shared cache for forms API routes
// This ensures cache invalidation works across different route handlers

interface CacheEntry {
  data: any;
  timestamp: number;
}

const formsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCacheKey(userRole: string): string {
  return `forms:${userRole}`;
}

export function getFromCache(key: string): any | null {
  const entry = formsCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  formsCache.delete(key); // Remove expired entry
  return null;
}

export function setCache(key: string, data: any): void {
  formsCache.set(key, { data, timestamp: Date.now() });

  // Simple cleanup: remove old entries periodically
  if (formsCache.size > 50) {
    const now = Date.now();
    for (const [k, entry] of formsCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        formsCache.delete(k);
      }
    }
  }
}

export function invalidateCacheForRoles(roles: string[]): void {
  for (const role of roles) {
    const cacheKey = getCacheKey(role);
    formsCache.delete(cacheKey);
  }
}

export function invalidateAllCache(): void {
  formsCache.clear();
}

