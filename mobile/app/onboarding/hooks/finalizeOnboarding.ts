import { useOnboardingStore } from './useOnboardingStore';

const REQUEST_TIMEOUT_MS = 60000; // large : couvre le cold-start Render (~42s)

/** XP par bonne réponse aux questions démo — doit rester aligné avec XpReveal (ResultStep). */
export const DEMO_XP_PER_CORRECT = 10;

export type FinalizeState = {
  username: string;
  email: string | null;
  password: string;
  domain: string | null;
  goal: string | null;
  dailyMinutes: 5 | 10 | 15 | null;
  reminderHour: number | null;
  notificationsEnabled: boolean;
  /** Bonnes réponses aux questions démo (0-3) — créditées en XP à l'inscription. */
  demoScore: number;
};

/** Signature minimale de fetch dont on a besoin (toujours appelé avec une URL string). */
export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface FinalizeDeps {
  apiUrl: string;
  getExistingUserId: () => Promise<string | null>;
  getExistingToken: () => Promise<string | null>;
  persistAuth: (token: string, id: string, username: string) => Promise<void>;
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

  // 1) Inscription idempotente : si un user existe déjà, on réutilise son token.
  let userId = await deps.getExistingUserId();
  let username = state.username;
  let token = await deps.getExistingToken();

  // Idempotency is keyed on the SESSION TOKEN, not userId: a stale @mindy/user_id
  // (e.g. left by an older app version) must NOT cause us to skip registration and
  // end up tokenless. Only skip when we already hold a valid token.
  if (!token) {
    if (!state.email) throw new Error('Email manquant. Reviens à l\'étape précédente.');
    if (!state.password) throw new Error('Mot de passe manquant. Reviens à l\'étape précédente.');

    const body = {
      username: state.username,
      email: state.email,
      password: state.password,
      preferredDomain: state.domain ?? undefined,
      userGoal: state.goal ?? undefined,
      dailyMinutes: state.dailyMinutes ?? undefined,
      reminderHour: state.reminderHour ?? undefined,
    };

    let resp: Response;
    try {
      resp = await fetchWithTimeout(fetchImpl, `${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error(`Cannot reach the server (${(err as Error).message}). API: ${apiUrl}`);
    }
    if (!resp.ok) {
      let serverMsg = '';
      try {
        const b = await resp.json();
        serverMsg = typeof b?.message === 'string' ? b.message : (b?.message?.message ?? '');
      } catch { /* ignore */ }
      if (resp.status === 409) throw new Error(serverMsg || 'Ce nom ou cet email est déjà pris.');
      throw new Error(`Failed to register (HTTP ${resp.status}${serverMsg ? ` — ${serverMsg}` : ''})`);
    }
    const { data } = await resp.json();
    token = data.accessToken;
    userId = data.user.id as string;
    username = data.user.username;
    await deps.persistAuth(token as string, userId, username);

    // Créditer l'XP promise par le ResultStep (demoScore × 10), uniquement à la
    // PREMIÈRE inscription : au retry (token déjà présent) on ne repasse pas ici,
    // donc pas de double crédit. Non-bloquant : perdre 10-30 XP vaut mieux que
    // bloquer la création du compte.
    const demoXp = state.demoScore * DEMO_XP_PER_CORRECT;
    if (demoXp > 0) {
      try {
        await fetchWithTimeout(fetchImpl, `${apiUrl}/users/${userId}/xp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: demoXp }),
        });
      } catch (err) {
        console.warn('[finalize] crédit XP démo échoué (non-bloquant):', err);
      }
    }
  }

  // 2) Push token — endpoint + platform + permission + header auth (non bloquant).
  if (state.notificationsEnabled) {
    try {
      const granted = await deps.requestPushPermission();
      if (granted) {
        const pushToken = await deps.getPushToken();
        await fetchWithTimeout(fetchImpl, `${apiUrl}/notifications/register-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            userId, token: pushToken, platform: toPlatformEnum(deps.platformOS),
          }),
        });
      }
    } catch (err) {
      console.warn('[finalize] push token failed (non-blocking):', err);
    }
  }

  await deps.clearOnboarding();
  deps.navigateToApp();
}

/** Point d'entrée réel utilisé par l'UI : câble les vraies dépendances. */
export async function finalizeOnboarding(): Promise<void> {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const { router } = require('expo-router');
  const Notifications = require('expo-notifications');
  const { Platform } = require('react-native');
  const Constants = require('expo-constants').default;
  const { setAuthToken } = require('../../../src/api/client');

  const s = useOnboardingStore.getState();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  const projectId =
    (Constants.expoConfig?.extra as any)?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId;

  await runFinalize(
    {
      username: s.username, email: s.email, password: s.password,
      domain: s.domain, goal: s.goal,
      dailyMinutes: s.dailyMinutes, reminderHour: s.reminderHour,
      notificationsEnabled: s.notificationsEnabled,
      demoScore: s.demoScore,
    },
    {
      apiUrl,
      getExistingUserId: () => AsyncStorage.getItem('@mindy/user_id'),
      getExistingToken: () => AsyncStorage.getItem('@mindy/auth_token'),
      persistAuth: async (token: string, id: string, username: string) => {
        setAuthToken(token);
        await AsyncStorage.multiSet([
          ['@mindy/auth_token', token],
          ['@mindy/user_id', id],
          ['@mindy/username', username],
        ]);
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
