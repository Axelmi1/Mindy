/**
 * usePushToken — Registers the device's Expo push token with the backend.
 *
 * Call this once per session after the user ID is available (e.g. in _layout.tsx or HomeScreen).
 * Silently no-ops if the user hasn't granted notification permissions or if
 * the device can't obtain a token (simulators, etc.).
 *
 * Idempotent: the backend upserts the token, so calling multiple times is safe.
 */

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { notificationsApi } from '@/api/client';

// Configure how notifications are displayed while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Returns the Expo push token for this device, or null if unavailable.
 * Requests permission if not already granted.
 */
async function getExpoPushToken(): Promise<string | null> {
  // Push tokens only work on physical devices
  if (!Device.isDevice) return null;

  // Request / check permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#39FF14',
    });
  }

  // Get the Expo push token using the projectId from app config
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return tokenData.data;
}

/**
 * Hook — registers this device's push token with the Mindly backend.
 * Only runs once per mount when userId is available.
 */
export function usePushToken(userId: string | null) {
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (!userId || hasRegistered.current) return;

    let cancelled = false;

    (async () => {
      try {
        const token = await getExpoPushToken();
        if (!token || cancelled) return;

        // WEB is not supported by the backend push token system — skip silently
        if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
        const platform: 'IOS' | 'ANDROID' =
          Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

        await notificationsApi.registerToken({ userId, token, platform });
        hasRegistered.current = true;
      } catch (err) {
        // Non-blocking — push token registration should never crash the app
        console.warn('[usePushToken] Failed to register push token:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);
}
