import { useOnboardingStore } from './useOnboardingStore';

const REQUEST_TIMEOUT_MS = 60000; // large : couvre le cold-start Render (~42s)

export type FinalizeState = {
  username: string;
  email: string | null;
  domain: string | null;
  goal: string | null;
  dailyMinutes: 5 | 10 | 15 | null;
  reminderHour: number | null;
  notificationsEnabled: boolean;
};

/** Signature minimale de fetch dont on a besoin (toujours appelé avec une URL string). */
export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface FinalizeDeps {
  apiUrl: string;
  getExistingUserId: () => Promise<string | null>;
  persistUser: (id: string, username: string) => Promise<void>;
  clearOnboarding: () => Promise<void>;
  navigateToApp: () => void;
  requestPushPermission: () => Promise<boolean>;
  getPushToken: () => Promise<string>;
  platformOS: string;
  fetchImpl: FetchLike;
}

export function toPlatformEnum(os: string): 'IOS' | 'ANDROID' {
  return os === 'ios' ? 'IOS' : 'ANDROID';
}

async function fetchWithTimeout(
  fetchImpl: FetchLike, input: string, init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Orchestration testable (sans dépendances natives). */
export async function runFinalize(state: FinalizeState, deps: FinalizeDeps): Promise<void> {
  const { apiUrl, fetchImpl } = deps;

  // 1) Création idempotente du user.
  let userId = await deps.getExistingUserId();
  let username = state.username;

  if (!userId) {
    const createBody: Record<string, unknown> = { username: state.username };
    if (state.email) createBody.email = state.email;

    let resp: Response;
    try {
      resp = await fetchWithTimeout(fetchImpl, `${apiUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody),
      });
    } catch (err) {
      throw new Error(`Cannot reach the server (${(err as Error).message}). API: ${apiUrl}`);
    }
    if (!resp.ok) {
      let serverMsg = '';
      try {
        const body = await resp.json();
        serverMsg = typeof body?.message === 'string' ? body.message : (body?.message?.message ?? '');
      } catch { /* ignore */ }
      if (resp.status === 409) throw new Error(serverMsg || 'Ce nom est déjà pris, choisis-en un autre.');
      throw new Error(`Failed to create user (HTTP ${resp.status}${serverMsg ? ` — ${serverMsg}` : ''})`);
    }
    const { data: user } = await resp.json();
    userId = user.id as string;
    username = user.username;
    await deps.persistUser(userId, username);
  }

  // 2) Préférences (non bloquant).
  try {
    await fetchWithTimeout(fetchImpl, `${apiUrl}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferredDomain: state.domain,
        userGoal: state.goal,
        dailyMinutes: state.dailyMinutes,
        reminderHour: state.reminderHour,
      }),
    });
  } catch (err) {
    console.warn('[finalize] prefs failed (non-blocking):', err);
  }

  // 3) Push token — endpoint correct + platform + permission (non bloquant).
  if (state.notificationsEnabled) {
    try {
      const granted = await deps.requestPushPermission();
      if (granted) {
        const token = await deps.getPushToken();
        await fetchWithTimeout(fetchImpl, `${apiUrl}/notifications/register-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId, token, platform: toPlatformEnum(deps.platformOS),
          }),
        });
      }
    } catch (err) {
      console.warn('[finalize] push token failed (non-blocking):', err);
    }
  }

  // 4) Magic link si email (non bloquant, fire-and-forget).
  if (state.email) {
    fetchWithTimeout(fetchImpl, `${apiUrl}/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: state.email }),
    }).catch((err) => console.warn('[finalize] magic link failed:', err));
  }

  await deps.clearOnboarding();
  deps.navigateToApp();
}

/** Point d'entrée réel utilisé par l'UI : câble les vraies dépendances. */
export async function finalizeOnboarding(): Promise<void> {
  // Imports natifs paresseux : évitent de casser Jest (env node) à l'import du module.
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const { router } = require('expo-router');
  const Notifications = require('expo-notifications');
  const { Platform } = require('react-native');
  const Constants = require('expo-constants').default;

  const s = useOnboardingStore.getState();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  const projectId =
    (Constants.expoConfig?.extra as any)?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId;

  await runFinalize(
    {
      username: s.username, email: s.email,
      domain: s.domain, goal: s.goal,
      dailyMinutes: s.dailyMinutes, reminderHour: s.reminderHour,
      notificationsEnabled: s.notificationsEnabled,
    },
    {
      apiUrl,
      getExistingUserId: () => AsyncStorage.getItem('@mindy/user_id'),
      persistUser: async (id, username) => {
        await AsyncStorage.multiSet([['@mindy/user_id', id], ['@mindy/username', username]]);
      },
      clearOnboarding: async () => {
        s.reset();
        await AsyncStorage.removeItem('@mindy/onboarding_state');
      },
      navigateToApp: () => router.replace('/(tabs)'),
      requestPushPermission: async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      },
      getPushToken: async () => {
        const t = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        return t.data;
      },
      platformOS: Platform.OS,
      fetchImpl: fetch,
    },
  );
}
