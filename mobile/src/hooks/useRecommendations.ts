/**
 * useRecommendations
 *
 * Fetches AI-powered personalized learning path for the current user.
 * Caches for 10 minutes to avoid hammering the API.
 */

import { useState, useEffect, useCallback } from 'react';
import { recommendationsApi, type PersonalizedPath } from '@/api/client';
import { useUser } from './useUser';

interface UseRecommendationsResult {
  path: PersonalizedPath | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Simple in-memory cache
const cache: Map<string, { data: PersonalizedPath; ts: number }> = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function useRecommendations(): UseRecommendationsResult {
  const { userId } = useUser();
  const [path, setPath] = useState<PersonalizedPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) return;

    // Check cache
    const cached = cache.get(userId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setPath(cached.data);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await recommendationsApi.getPath(userId);
      if (res.data) {
        cache.set(userId, { data: res.data, ts: Date.now() });
        setPath(res.data);
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    if (userId) cache.delete(userId);
    await fetch();
  }, [userId, fetch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { path, loading, error, refresh };
}
