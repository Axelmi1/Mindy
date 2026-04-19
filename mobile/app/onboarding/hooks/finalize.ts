import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useOnboardingStore } from './useOnboardingStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function finalizeOnboarding(): Promise<void> {
  const s = useOnboardingStore.getState();

  const createBody: Record<string, unknown> = { username: s.username };
  if (s.email) createBody.email = s.email;

  const createResp = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createBody),
  });
  if (!createResp.ok) throw new Error('Failed to create user');
  const { data: user } = await createResp.json();

  await fetch(`${API_URL}/users/${user.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preferredDomain: s.domain,
      userGoal: s.goal,
      dailyMinutes: s.dailyMinutes,
      reminderHour: s.reminderHour,
    }),
  });

  if (s.notificationsEnabled) {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      await fetch(`${API_URL}/notifications/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, token: token.data }),
      });
    } catch (err) {
      console.warn('Failed to register push token:', err);
    }
  }

  if (s.email) {
    fetch(`${API_URL}/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: s.email }),
    }).catch((err) => console.warn('Magic link send failed:', err));
  }

  await AsyncStorage.multiSet([
    ['@mindy/user_id', user.id],
    ['@mindy/username', user.username],
  ]);

  s.reset();
  await AsyncStorage.removeItem('@mindy/onboarding_state');
  router.replace('/(tabs)');
}
