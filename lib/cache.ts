/**
 * Client-side caching utilities for Next.js App Router
 * Provides sessionStorage-based caching with expiration and revalidation
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  version?: string;
}

export interface CacheOptions {
  expiry?: number; // in milliseconds
  version?: string;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

export class AppCache {
  private static isClient = typeof window !== 'undefined';
  private static listeners = new Map<string, Set<() => void>>();

  /**
   * Set data in cache with expiration
   */
  static set<T>(key: string, data: T, options: CacheOptions = {}): void {
    if (!this.isClient) return;
    
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry: options.expiry || 30 * 60 * 1000, // Default 30 minutes
        version: options.version,
      };
      
      sessionStorage.setItem(key, JSON.stringify(cacheEntry));
      
      // Notify listeners of cache update
      this.notifyListeners(key);
    } catch (error) {
      console.warn(`Failed to cache data for key "${key}":`, error);
    }
  }

  /**
   * Get data from cache if not expired
   */
  static get<T>(key: string): T | null {
    if (!this.isClient) return null;
    
    try {
      const cached = sessionStorage.getItem(key);
      if (!cached) return null;

      const cacheEntry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - cacheEntry.timestamp > cacheEntry.expiry) {
        this.remove(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.warn(`Failed to retrieve cached data for key "${key}":`, error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Check if cache entry is expired
   */
  static isExpired(key: string): boolean {
    if (!this.isClient) return true;
    
    try {
      const cached = sessionStorage.getItem(key);
      if (!cached) return true;

      const cacheEntry: CacheEntry<any> = JSON.parse(cached);
      const now = Date.now();
      
      return now - cacheEntry.timestamp > cacheEntry.expiry;
    } catch (error) {
      return true;
    }
  }

  /**
   * Remove specific cache entry
   */
  static remove(key: string): void {
    if (!this.isClient) return;
    
    try {
      sessionStorage.removeItem(key);
      this.notifyListeners(key);
    } catch (error) {
      console.warn(`Failed to remove cache entry for key "${key}":`, error);
    }
  }

  /**
   * Clear all cache entries or entries matching a pattern
   */
  static clear(pattern?: string): void {
    if (!this.isClient) return;
    
    try {
      if (pattern) {
        // Clear entries matching pattern
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
          if (key.includes(pattern)) {
            sessionStorage.removeItem(key);
            this.notifyListeners(key);
          }
        });
      } else {
        // Clear all sessionStorage
        sessionStorage.clear();
        // Notify all listeners
        this.listeners.forEach((listeners, key) => {
          this.notifyListeners(key);
        });
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache metadata
   */
  static getMetadata(key: string): { timestamp: number; expiry: number; version?: string } | null {
    if (!this.isClient) return null;
    
    try {
      const cached = sessionStorage.getItem(key);
      if (!cached) return null;

      const cacheEntry: CacheEntry<any> = JSON.parse(cached);
      return {
        timestamp: cacheEntry.timestamp,
        expiry: cacheEntry.expiry,
        version: cacheEntry.version,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Subscribe to cache changes for a specific key
   */
  static subscribe(key: string, callback: () => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Notify listeners of cache changes
   */
  private static notifyListeners(key: string): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.warn('Cache listener error:', error);
        }
      });
    }
  }

  /**
   * Prefetch data and cache it
   */
  static async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Check if we already have valid cached data
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await fetcher();
      this.set(key, data, options);
      return data;
    } catch (error) {
      console.error(`Failed to prefetch data for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache entries by pattern or specific key
   */
  static invalidate(keyOrPattern: string): void {
    if (!this.isClient) return;
    
    try {
      const keys = Object.keys(sessionStorage);
      const matchingKeys = keys.filter(key => 
        key === keyOrPattern || key.includes(keyOrPattern)
      );
      
      matchingKeys.forEach(key => {
        sessionStorage.removeItem(key);
        this.notifyListeners(key);
      });
    } catch (error) {
      console.warn('Failed to invalidate cache:', error);
    }
  }

  /**
   * Get cache size and statistics
   */
  static getStats(): {
    totalEntries: number;
    totalSize: number;
    entries: Array<{
      key: string;
      size: number;
      age: number;
      expired: boolean;
    }>;
  } {
    if (!this.isClient) {
      return { totalEntries: 0, totalSize: 0, entries: [] };
    }

    const stats = {
      totalEntries: 0,
      totalSize: 0,
      entries: [] as Array<{
        key: string;
        size: number;
        age: number;
        expired: boolean;
      }>,
    };

    try {
      const keys = Object.keys(sessionStorage);
      const now = Date.now();

      keys.forEach(key => {
        const value = sessionStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          stats.totalSize += size;
          stats.totalEntries++;

          try {
            const cacheEntry: CacheEntry<any> = JSON.parse(value);
            const age = now - cacheEntry.timestamp;
            const expired = age > cacheEntry.expiry;

            stats.entries.push({
              key,
              size,
              age,
              expired,
            });
          } catch {
            // Not a cache entry, just regular sessionStorage
            stats.entries.push({
              key,
              size,
              age: 0,
              expired: false,
            });
          }
        }
      });
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }

    return stats;
  }
}

// Cache key constants
export const CACHE_KEYS = {
  USER: 'weather-app-user-cache',
  ROLES: 'weather-app-roles-cache',
  PERMISSIONS: 'weather-app-permissions-cache',
  FORMS: 'weather-app-forms-cache',
  FORM_SUBMISSIONS: 'weather-app-form-submissions-cache',
} as const;

// Cache expiration constants (in milliseconds)
export const CACHE_EXPIRY = {
  USER: 30 * 60 * 1000, // 30 minutes
  ROLES: 24 * 60 * 60 * 1000, // 24 hours
  PERMISSIONS: 60 * 60 * 1000, // 1 hour
  FORMS: 10 * 60 * 1000, // 10 minutes
  FORM_SUBMISSIONS: 5 * 60 * 1000, // 5 minutes
} as const;
