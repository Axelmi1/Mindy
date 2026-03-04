import { useEffect, useCallback } from 'react';
import {
  analyticsService,
  initializeAnalytics,
  trackEvent as trackEventService,
  trackScreen as trackScreenService,
  cleanupAnalytics,
  EventType,
} from '../services/analytics';

/**
 * Hook to initialize analytics and provide tracking functions
 */
export function useAnalytics(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    initializeAnalytics(userId);

    return () => {
      cleanupAnalytics();
    };
  }, [userId]);

  const track = useCallback(
    (eventType: EventType, eventData?: Record<string, unknown>) => {
      trackEventService(eventType, eventData);
    },
    []
  );

  const trackScreen = useCallback((screenName: string) => {
    trackScreenService(screenName);
  }, []);

  return { track, trackScreen };
}

/**
 * Hook to track screen views
 * Use in each screen component
 */
export function useScreenTracking(screenName: string) {
  useEffect(() => {
    trackScreenService(screenName);
  }, [screenName]);
}

// Re-export types
export type { EventType } from '../services/analytics';
