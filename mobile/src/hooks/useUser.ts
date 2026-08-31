import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, setAuthToken, setUnauthorizedHandler, API_BASE_URL } from '@/api/client';

const TOKEN_KEY = '@mindy/auth_token';
const USER_ID_KEY = '@mindy/user_id';
const USERNAME_KEY = '@mindy/username';
const ADMIN_KEY = '@mindy/admin_mode';
const ONBOARDING_KEY = '@mindy/onboarding_state';
const REQUEST_TIMEOUT_MS = 15000;
const API_URL = API_BASE_URL;

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

interface UserState {
  userId: string | null;
  username: string | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
}

/**
 * Manages the authenticated session (email/password + JWT).
 * The session is the bearer token in AsyncStorage; identity is verified via /auth/me.
 */
export function useUser() {
  const [state, setState] = useState<UserState>({
    userId: null,
    username: null,
    token: null,
    isLoading: true,
    isLoggedIn: false,
    error: null,
  });

  // Logout / full reset — "always start fresh".
  const clearUser = useCallback(async () => {
    setAuthToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_ID_KEY, USERNAME_KEY, ADMIN_KEY, ONBOARDING_KEY]);
    try {
      // Lazy require avoids a src→app import cycle and keeps jest happy.
      const { useOnboardingStore } = require('../../app/onboarding/hooks/useOnboardingStore');
      useOnboardingStore.getState().reset();
    } catch {
      /* store not loaded (e.g. unit tests) — nothing to reset */
    }
    setState({ userId: null, username: null, token: null, isLoading: false, isLoggedIn: false, error: null });
  }, []);

  const checkExistingUser = useCallback(async () => {
    try {
      const [storedToken, storedUserId, storedUsername] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_ID_KEY),
        AsyncStorage.getItem(USERNAME_KEY),
      ]);

      if (!storedToken) {
        setAuthToken(null);
        setState({ userId: null, username: null, token: null, isLoading: false, isLoggedIn: false, error: null });
        return false;
      }

      setAuthToken(storedToken);

      try {
        const res = await fetchWithTimeout(
          `${API_URL}/auth/me`,
          { headers: { Authorization: `Bearer ${storedToken}` } },
          5000,
        );
        if (res.ok) {
          const data = await res.json();
          const user = data?.data;
          const username = user?.username ?? storedUsername;
          const userId = user?.id ?? storedUserId;
          if (username && username !== storedUsername) await AsyncStorage.setItem(USERNAME_KEY, username);
          if (userId && userId !== storedUserId) await AsyncStorage.setItem(USER_ID_KEY, userId);
          setState({ userId, username, token: storedToken, isLoading: false, isLoggedIn: true, error: null });
          return true;
        }
        if (res.status === 401) {
          await clearUser();
          return false;
        }
        // Other server error — trust cached creds rather than logging the user out.
        if (storedUserId) {
          setState({ userId: storedUserId, username: storedUsername, token: storedToken, isLoading: false, isLoggedIn: true, error: null });
          return true;
        }
      } catch {
        // Offline / timeout — trust cached creds.
        if (storedUserId) {
          setState({ userId: storedUserId, username: storedUsername, token: storedToken, isLoading: false, isLoggedIn: true, error: null });
          return true;
        }
      }

      await clearUser();
      return false;
    } catch (err) {
      setState({
        userId: null,
        username: null,
        token: null,
        isLoading: false,
        isLoggedIn: false,
        error: err instanceof Error ? err.message : 'Failed to check user',
      });
      return false;
    }
  }, [clearUser]);

  // Email/password login.
  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password); // throws on 401 (bad creds)
    if (!res.success || !res.data) throw new Error(res.message || 'Connexion échouée');
    const { accessToken, user } = res.data;
    setAuthToken(accessToken);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, accessToken],
      [USER_ID_KEY, user.id],
      [USERNAME_KEY, user.username],
    ]);
    setState({ userId: user.id, username: user.username, token: accessToken, isLoading: false, isLoggedIn: true, error: null });
    return user;
  }, []);

  const initUser = useCallback(async () => {
    await checkExistingUser();
  }, [checkExistingUser]);

  useEffect(() => {
    checkExistingUser();
  }, [checkExistingUser]);

  // A 401 on any authenticated request = session expired → reset + go to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearUser().then(() => {
        try {
          const { router } = require('expo-router');
          router.replace('/login');
        } catch {
          /* router unavailable (tests) */
        }
      });
    });
    return () => setUnauthorizedHandler(null);
  }, [clearUser]);

  return { ...state, initUser, login, clearUser, refreshUser: checkExistingUser };
}
