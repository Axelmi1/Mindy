import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { challengesApi } from '@/api/client';

const POLL_INTERVAL_MS = 30_000; // refresh every 30s when app is active

/**
 * Returns the number of pending challenges received by the user.
 * Auto-refreshes every 30 seconds while the app is in the foreground.
 */
export function usePendingChallenges(userId: string | null) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    if (!userId) {
      setPendingCount(0);
      return;
    }
    try {
      setIsLoading(true);
      const res = await challengesApi.getPendingCount(userId);
      if (res.success && res.data) {
        setPendingCount(res.data.pendingCount);
      }
    } catch {
      // Fail silently — badge is best-effort
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Start polling when the app is foregrounded, stop when backgrounded
  useEffect(() => {
    if (!userId) return;

    fetchCount();

    const startPolling = () => {
      intervalRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        fetchCount();
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [userId, fetchCount]);

  return { pendingCount, isLoading, refresh: fetchCount };
}
