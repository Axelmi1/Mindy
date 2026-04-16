import { useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import {
  notificationService,
  initializeNotifications,
  setOnNotificationTap,
  cleanupNotifications,
  scheduleStreakReminder,
  scheduleDailyChallengeReminder,
} from '../services/notifications';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface NotificationPreferences {
  streakReminder: boolean;
  dailyChallenge: boolean;
  inactivityReminder: boolean;
  levelUpCelebration: boolean;
  streakMilestone: boolean;
  reminderHour: number;
  timezone: string;
}

/**
 * Hook to initialize notification service
 */
export function useNotificationInitializer(userId: string | null) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Initialize notifications + auto-schedule local reminders
    initializeNotifications(userId).then(async (success) => {
      setIsReady(success);
      if (success) {
        // Schedule daily reminders (idempotent — cancels existing before rescheduling)
        await Promise.all([
          scheduleStreakReminder(20, 0),          // 20:00 streak reminder
          scheduleDailyChallengeReminder(9, 0),  // 09:00 daily challenge
        ]);
      }
    });

    // Handle notification taps - navigate to appropriate screen
    setOnNotificationTap((data) => {
      const type = data.type as string;

      switch (type) {
        case 'STREAK_AT_RISK':
        case 'INACTIVITY_REMINDER':
          router.push('/(tabs)/learn' as any);
          break;
        case 'DAILY_CHALLENGE':
          router.push('/daily-challenge');
          break;
        case 'LEVEL_UP':
        case 'STREAK_MILESTONE':
          router.push('/(tabs)/profile' as any);
          break;
        default:
          router.push('/(tabs)' as any);
      }
    });

    return () => {
      cleanupNotifications();
    };
  }, [userId]);

  return isReady;
}

/**
 * Hook to manage notification preferences
 */
export function useNotifications(userId: string | null) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/preferences/${userId}`);
      if (response.ok) {
        const result = await response.json();
        setPreferences(result.data);
      }
    } catch (error) {
      console.warn('[useNotifications] Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Check if notifications are enabled
  useEffect(() => {
    if (!userId) return;

    notificationService.isEnabled().then(setIsEnabled);
    loadPreferences();
  }, [userId, loadPreferences]);

  // Update preferences
  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/notifications/preferences/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          const result = await response.json();
          setPreferences(result.data);
        }
      } catch (error) {
        console.warn('[useNotifications] Failed to update preferences:', error);
      }
    },
    [userId]
  );

  return {
    isEnabled,
    preferences,
    isLoading,
    updatePreferences,
    refreshPreferences: loadPreferences,
  };
}
