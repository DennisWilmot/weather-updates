/**
 * Development tools for cache monitoring and debugging
 * Only available in development mode
 */

import { AppCache, CACHE_KEYS } from './cache';

export interface CacheDebugInfo {
  key: string;
  size: string;
  age: string;
  expired: boolean;
  data?: any;
}

export class CacheDevTools {
  private static isDev = process.env.NODE_ENV === 'development';

  /**
   * Initialize development tools
   * Adds cache utilities to window object for console debugging
   */
  static init(): void {
    if (!this.isDev || typeof window === 'undefined') return;

    // Add cache utilities to window for easy debugging
    (window as any).AppCache = AppCache;
    (window as any).cacheDebug = {
      stats: () => this.getDetailedStats(),
      clear: (pattern?: string) => AppCache.clear(pattern),
      get: (key: string) => AppCache.get(key),
      set: (key: string, data: any, options?: any) => AppCache.set(key, data, options),
      keys: () => this.getAllKeys(),
      inspect: (key: string) => this.inspectCache(key),
      monitor: () => this.startMonitoring(),
      stopMonitor: () => this.stopMonitoring(),
    };

    console.log('🚀 Cache Dev Tools initialized. Use window.cacheDebug for debugging.');
    console.log('Available commands:');
    console.log('  - cacheDebug.stats() - Get cache statistics');
    console.log('  - cacheDebug.keys() - List all cache keys');
    console.log('  - cacheDebug.inspect(key) - Inspect specific cache entry');
    console.log('  - cacheDebug.clear(pattern) - Clear cache entries');
    console.log('  - cacheDebug.monitor() - Start cache monitoring');
  }

  /**
   * Get detailed cache statistics
   */
  static getDetailedStats(): {
    summary: any;
    entries: CacheDebugInfo[];
    recommendations: string[];
  } {
    const stats = AppCache.getStats();
    const recommendations: string[] = [];

    // Generate recommendations
    if (stats.totalSize > 2 * 1024 * 1024) { // 2MB
      recommendations.push('Cache size is large (>2MB). Consider clearing old entries.');
    }

    const expiredCount = stats.entries.filter(e => e.expired).length;
    if (expiredCount > 5) {
      recommendations.push(`${expiredCount} expired entries found. Consider cleanup.`);
    }

    const entries: CacheDebugInfo[] = stats.entries.map(entry => ({
      key: entry.key,
      size: this.formatBytes(entry.size),
      age: this.formatDuration(entry.age),
      expired: entry.expired,
    }));

    return {
      summary: {
        totalEntries: stats.totalEntries,
        totalSize: this.formatBytes(stats.totalSize),
        expiredEntries: expiredCount,
        validEntries: stats.totalEntries - expiredCount,
      },
      entries,
      recommendations,
    };
  }

  /**
   * Get all cache keys
   */
  static getAllKeys(): string[] {
    if (typeof window === 'undefined') return [];
    
    try {
      return Object.keys(sessionStorage).filter(key => 
        key.startsWith('weather-app-')
      );
    } catch {
      return [];
    }
  }

  /**
   * Inspect specific cache entry
   */
  static inspectCache(key: string): {
    exists: boolean;
    expired: boolean;
    metadata?: any;
    data?: any;
    size?: string;
  } {
    const exists = AppCache.has(key);
    const expired = AppCache.isExpired(key);
    const metadata = AppCache.getMetadata(key);
    const data = AppCache.get(key);

    let size: string | undefined;
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) {
          size = this.formatBytes(new Blob([raw]).size);
        }
      } catch {
        // Ignore
      }
    }

    return {
      exists,
      expired,
      metadata,
      data,
      size,
    };
  }

  /**
   * Start cache monitoring
   */
  private static monitoringInterval?: NodeJS.Timeout;
  
  static startMonitoring(): void {
    if (!this.isDev) return;

    this.stopMonitoring(); // Stop existing monitoring

    console.log('📊 Starting cache monitoring...');
    
    this.monitoringInterval = setInterval(() => {
      const stats = this.getDetailedStats();
      
      console.group('🗄️ Cache Monitor');
      console.log('Summary:', stats.summary);
      
      if (stats.recommendations.length > 0) {
        console.warn('Recommendations:', stats.recommendations);
      }
      
      // Log cache operations
      const keys = Object.values(CACHE_KEYS);
      keys.forEach(key => {
        const info = this.inspectCache(key);
        if (info.exists) {
          console.log(`${key}: ${info.size} (${info.expired ? 'expired' : 'valid'})`);
        }
      });
      
      console.groupEnd();
    }, 10000); // Every 10 seconds
  }

  /**
   * Stop cache monitoring
   */
  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('⏹️ Cache monitoring stopped');
    }
  }

  /**
   * Format bytes to human readable string
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Format duration to human readable string
   */
  private static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Performance test for cache operations
   */
  static performanceTest(): {
    set: number;
    get: number;
    has: number;
    clear: number;
  } {
    if (!this.isDev) {
      return { set: 0, get: 0, has: 0, clear: 0 };
    }

    const testData = { test: 'data', array: [1, 2, 3], nested: { a: 1, b: 2 } };
    const iterations = 1000;
    
    // Test SET performance
    const setStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      AppCache.set(`test-${i}`, testData);
    }
    const setTime = performance.now() - setStart;

    // Test GET performance
    const getStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      AppCache.get(`test-${i}`);
    }
    const getTime = performance.now() - getStart;

    // Test HAS performance
    const hasStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      AppCache.has(`test-${i}`);
    }
    const hasTime = performance.now() - hasStart;

    // Test CLEAR performance
    const clearStart = performance.now();
    AppCache.clear('test-');
    const clearTime = performance.now() - clearStart;

    const results = {
      set: Math.round(setTime * 100) / 100,
      get: Math.round(getTime * 100) / 100,
      has: Math.round(hasTime * 100) / 100,
      clear: Math.round(clearTime * 100) / 100,
    };

    console.log('🏃 Cache Performance Test Results (ms):', results);
    return results;
  }

  /**
   * Validate cache integrity
   */
  static validateCache(): {
    valid: boolean;
    issues: string[];
    totalChecked: number;
  } {
    const issues: string[] = [];
    const keys = this.getAllKeys();
    let validCount = 0;

    keys.forEach(key => {
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          
          // Check if it's a valid cache entry
          if (typeof parsed === 'object' && parsed.data !== undefined && parsed.timestamp !== undefined) {
            validCount++;
            
            // Check for corruption
            if (typeof parsed.timestamp !== 'number' || parsed.timestamp <= 0) {
              issues.push(`Invalid timestamp in ${key}`);
            }
            
            if (typeof parsed.expiry !== 'number' || parsed.expiry <= 0) {
              issues.push(`Invalid expiry in ${key}`);
            }
          }
        }
      } catch (error) {
        issues.push(`Failed to parse ${key}: ${error}`);
      }
    });

    const valid = issues.length === 0;
    
    console.log(`🔍 Cache Validation: ${valid ? '✅ PASSED' : '❌ FAILED'}`);
    if (issues.length > 0) {
      console.warn('Issues found:', issues);
    }

    return {
      valid,
      issues,
      totalChecked: keys.length,
    };
  }
}

// Auto-initialize in development
if (typeof window !== 'undefined') {
  CacheDevTools.init();
}
