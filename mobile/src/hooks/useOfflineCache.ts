/**
 * useOfflineCache hook
 * Wraps fetchWithCache with React state — handles loading, stale, offline banner.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithCache, type CacheOptions } from '../services/cache';

export interface UseOfflineCacheResult<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  isOffline: boolean;
  fromCache: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOfflineCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions & { enabled?: boolean } = {},
): UseOfflineCacheResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const load = useCallback(async () => {
    if (options.enabled === false) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchWithCache<T>(key, fetchFn, options);
      if (!isMounted.current) return;

      setData(result.data);
      setIsStale(result.isStale);
      setIsOffline(result.isOffline);
      setFromCache(result.fromCache);
    } catch (e: unknown) {
      if (!isMounted.current) return;
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      setError(msg);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, options.enabled]);

  useEffect(() => { load(); }, [load]);

  return { data, isLoading, isStale, isOffline, fromCache, error, refresh: load };
}
