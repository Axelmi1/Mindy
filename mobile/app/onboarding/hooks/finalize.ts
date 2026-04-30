import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useOnboardingStore } from './useOnboardingStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function finalizeOnboarding(): Promise<void> {
  const s = useOnboardingStore.getState();
  console.log('[finalize] API_URL =', API_URL);

  const createBody: Record<string, unknown> = { username: s.username };
  if (s.email) createBody.email = s.email;

  let createResp: Response;
  try {
    createResp = await fetchWithTimeout(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createBody),
    });
  } catch (err) {
    const msg = (err as Error).message || String(err);
    throw new Error(`Cannot reach the server (${msg}). API: ${API_URL}`);
  }
  if (!createResp.ok) {
    // Try to extract a server-provided message (e.g. 409 with field-specific text).
    let serverMsg = '';
    try {
      const body = await createResp.json();
      const inner = body?.message;
      if (typeof inner === 'string') serverMsg = inner;
      else if (inner?.message) serverMsg = inner.message;
    } catch {
      // ignore
    }
    if (createResp.status === 409) {
      throw new Error(serverMsg || 'Ce nom est déjà pris, choisis-en un autre.');
    }
    throw new Error(`Failed to create user (HTTP ${createResp.status}${serverMsg ? ` — ${serverMsg}` : ''})`);
  }
  const { data: user } = await createResp.json();

  // Persist user_id IMMEDIATELY so a crash in any later step doesn't leave us
  // with an orphaned user in DB and an empty AsyncStorage on the next launch.
  await AsyncStorage.multiSet([
    ['@mindy/user_id', user.id],
    ['@mindy/username', user.username],
  ]);

  try {
    const patchResp = await fetchWithTimeout(`${API_URL}/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferredDomain: s.domain,
        userGoal: s.goal,
        dailyMinutes: s.dailyMinutes,
        reminderHour: s.reminderHour,
      }),
    });
    if (!patchResp.ok) {
      console.warn('Failed to persist onboarding preferences (non-blocking)');
    }
  } catch (err) {
    console.warn('Failed to persist onboarding preferences (non-blocking):', err);
  }

  if (s.notificationsEnabled) {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      await fetchWithTimeout(`${API_URL}/notifications/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, token: token.data }),
      });
    } catch (err) {
      console.warn('Failed to register push token:', err);
    }
  }

  if (s.email) {
    fetchWithTimeout(`${API_URL}/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: s.email }),
    }).catch((err) => console.warn('Magic link send failed:', err));
  }

  s.reset();
  await AsyncStorage.removeItem('@mindy/onboarding_state');
  router.replace('/(tabs)');
}
