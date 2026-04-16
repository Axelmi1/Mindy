/**
 * Offline Cache Service
 * Smart AsyncStorage-based cache with TTL, stale-while-revalidate pattern,
 * and network detection. Powers "offline first" UX across Mindy.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  cachedAt: number;   // epoch ms
  ttlMs: number;      // max age in ms
  version: number;    // bump to invalidate all on app update
}

export interface CacheOptions {
  /** Time to live in seconds. Default: 300 (5 min) */
  ttlSeconds?: number;
  /** If true, return stale data and trigger revalidation in the background */
  staleWhileRevalidate?: boolean;
}

type FetchFn<T> = () => Promise<T>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_PREFIX = '@mindy/cache/';
const CACHE_VERSION = 1;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Network detection ────────────────────────────────────────────────────────

let _isConnected: boolean | null = null;

// Subscribe to connectivity changes
NetInfo.addEventListener((state) => {
  _isConnected = state.isConnected ?? null;
});

export async function isNetworkAvailable(): Promise<boolean> {
  if (_isConnected !== null) return _isConnected;
  const state = await NetInfo.fetch();
  _isConnected = state.isConnected ?? false;
  return _isConnected;
}

// ─── Core cache operations ────────────────────────────────────────────────────

/**
 * Write a value to cache.
 */
export async function cacheSet<T>(
  key: string,
  data: T,
  ttlSeconds = 300,
): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
    ttlMs: ttlSeconds * 1000,
    version: CACHE_VERSION,
  };
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    console.warn('[Cache] cacheSet failed for key:', key, error);
  }
}

/**
 * Read a value from cache. Returns null if missing, expired, or wrong version.
 */
export async function cacheGet<T>(key: string): Promise<{
  data: T;
  isStale: boolean;
} | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);

    // Version mismatch — invalidate
    if (entry.version !== CACHE_VERSION) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    const age = Date.now() - entry.cachedAt;
    const isStale = age > entry.ttlMs;

    return { data: entry.data, isStale };
  } catch (error) {
    console.warn('[Cache] cacheGet failed for key:', key, error);
    return null;
  }
}

/**
 * Delete a specific cache entry.
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // Ignore
  }
}

/**
 * Clear all Mindy cache entries.
 */
export async function cacheClearAll(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    console.log('[Cache] Cleared', cacheKeys.length, 'entries');
  } catch (error) {
    console.warn('[Cache] cacheClearAll failed:', error);
  }
}

// ─── High-level helper ────────────────────────────────────────────────────────

/**
 * Fetch with cache — the main utility.
 *
 * Behaviour:
 * - If online + cache is fresh → return cache (fast path)
 * - If online + cache is stale → return stale immediately, fetch fresh in bg
 * - If online + no cache → fetch, store, return
 * - If offline + cache exists (fresh or stale) → return cache with isOffline=true
 * - If offline + no cache → throw
 */
export async function fetchWithCache<T>(
  key: string,
  fn: FetchFn<T>,
  options: CacheOptions = {},
): Promise<{ data: T; fromCache: boolean; isOffline: boolean; isStale: boolean }> {
  const ttlSeconds = options.ttlSeconds ?? 300;
  const swr = options.staleWhileRevalidate ?? true;
  const online = await isNetworkAvailable();

  const cached = await cacheGet<T>(key);

  // OFFLINE path
  if (!online) {
    if (cached) {
      console.log(`[Cache] OFFLINE — serving cached data for "${key}" (stale=${cached.isStale})`);
      return { data: cached.data, fromCache: true, isOffline: true, isStale: cached.isStale };
    }
    throw new Error(`Offline — no cached data for "${key}"`);
  }

  // ONLINE — fresh cache
  if (cached && !cached.isStale) {
    return { data: cached.data, fromCache: true, isOffline: false, isStale: false };
  }

  // ONLINE — stale cache → stale-while-revalidate
  if (cached && cached.isStale && swr) {
    // Return stale immediately, revalidate in background
    (async () => {
      try {
        const fresh = await fn();
        await cacheSet(key, fresh, ttlSeconds);
      } catch (e) {
        console.warn(`[Cache] Background revalidation failed for "${key}":`, e);
      }
    })();
    return { data: cached.data, fromCache: true, isOffline: false, isStale: true };
  }

  // ONLINE — no cache or expired (non-SWR) → fetch fresh
  const fresh = await fn();
  await cacheSet(key, fresh, ttlSeconds);
  return { data: fresh, fromCache: false, isOffline: false, isStale: false };
}

// ─── Predefined cache keys ────────────────────────────────────────────────────

export const CACHE_KEYS = {
  userStats: (userId: string) => `user_stats_${userId}`,
  lessons: (domain?: string) => `lessons_${domain ?? 'all'}`,
  leaderboard: () => 'leaderboard_weekly',
  achievements: (userId: string) => `achievements_${userId}`,
  progress: (userId: string) => `progress_${userId}`,
  dailyChallenge: (userId: string, date: string) => `daily_challenge_${userId}_${date}`,
} as const;
