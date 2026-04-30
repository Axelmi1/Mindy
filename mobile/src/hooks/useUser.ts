import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@mindy/user_id';
const USERNAME_KEY = '@mindy/username';
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

interface UserState {
  userId: string | null;
  username: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
}

/**
 * Hook to manage user session
 * Supports anonymous users and (future) authenticated users
 */
export function useUser() {
  const [state, setState] = useState<UserState>({
    userId: null,
    username: null,
    isLoading: true,
    isLoggedIn: false,
    error: null,
  });

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Check if we have an existing user stored (with timeout)
  const checkExistingUser = useCallback(async () => {
    try {
      const [storedUserId, storedUsername] = await Promise.all([
        AsyncStorage.getItem(USER_ID_KEY),
        AsyncStorage.getItem(USERNAME_KEY),
      ]);

      if (storedUserId) {
        // Verify the user still exists in the database (with timeout)
        try {
          const verifyResponse = await fetchWithTimeout(
            `${API_URL}/users/${storedUserId}`,
            {},
            5000,
          );

          if (verifyResponse.ok) {
            const data = await verifyResponse.json();
            const username = data?.data?.username ?? storedUsername;
            // Update cached username if it changed
            if (username && username !== storedUsername) {
              await AsyncStorage.setItem(USERNAME_KEY, username);
            }
            setState({ userId: storedUserId, username, isLoading: false, isLoggedIn: true, error: null });
            return true;
          }
        } catch {
          // User not found or timeout - use cached username if available
          if (storedUsername) {
            setState({ userId: storedUserId, username: storedUsername, isLoading: false, isLoggedIn: true, error: null });
            return true;
          }
        }

        // User not found - clear stale data
        await AsyncStorage.multiRemove([USER_ID_KEY, USERNAME_KEY]);
      }

      setState({ userId: null, username: null, isLoading: false, isLoggedIn: false, error: null });
      return false;
    } catch (err) {
      console.error('Error checking user:', err);
      setState({
        userId: null,
        username: null,
        isLoading: false,
        isLoggedIn: false,
        error: err instanceof Error ? err.message : 'Failed to check user'
      });
      return false;
    }
  }, [API_URL]);

  // Create a new user (optionally with custom username + onboarding choices)
  const initUser = useCallback(async (
    customUsername?: string,
    preferences?: { preferredDomain?: string; userGoal?: string }
  ) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // First check if we already have a valid user
      const storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
      if (storedUserId && !customUsername) {
        try {
          const verifyResponse = await fetchWithTimeout(`${API_URL}/users/${storedUserId}`);
          if (verifyResponse.ok) {
            const data = await verifyResponse.json();
            const username = data?.data?.username ?? null;
            setState({ userId: storedUserId, username, isLoading: false, isLoggedIn: true, error: null });
            return;
          }
        } catch {
          // Continue to create new user
        }
        await AsyncStorage.multiRemove([USER_ID_KEY, USERNAME_KEY]);
      }

      const ts = Date.now();
      const finalUsername = customUsername?.trim() || `user_${ts.toString(36)}`;
      const finalEmail = `${finalUsername.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${ts}@mindy.app`;

      // Create new user
      let response: Response;
      try {
        response = await fetchWithTimeout(`${API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: finalEmail,
            username: finalUsername,
          }),
        });
      } catch (err) {
        const msg = (err as Error).message || String(err);
        throw new Error(`Cannot reach the server (${msg}). API: ${API_URL}`);
      }

      if (!response.ok) {
        let serverMsg = '';
        try {
          const body = await response.json();
          const inner = body?.message;
          if (typeof inner === 'string') serverMsg = inner;
          else if (inner?.message) serverMsg = inner.message;
        } catch {
          // ignore
        }
        if (response.status === 409) {
          throw new Error(serverMsg || 'Ce nom est déjà pris.');
        }
        throw new Error(`Failed to create user (HTTP ${response.status}${serverMsg ? ` — ${serverMsg}` : ''})`);
      }

      const result = await response.json();
      const userId = result.data.id;
      const username = result.data.username ?? null;

      // Save onboarding preferences (domain + goal) if provided
      if (preferences && (preferences.preferredDomain || preferences.userGoal)) {
        try {
          await fetchWithTimeout(`${API_URL}/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              preferredDomain: preferences.preferredDomain,
              userGoal: preferences.userGoal,
            }),
          });
        } catch {
          // Non-blocking — preferences are nice-to-have
        }
      }

      await AsyncStorage.multiSet([
        [USER_ID_KEY, userId],
        ...(username ? [[USERNAME_KEY, username] as [string, string]] : []),
        ...(preferences?.preferredDomain
          ? [['@mindy/preferred_domain', preferences.preferredDomain] as [string, string]]
          : []),
        ...(preferences?.userGoal
          ? [['@mindy/user_goal', preferences.userGoal] as [string, string]]
          : []),
      ]);
      setState({ userId, username, isLoading: false, isLoggedIn: true, error: null });
    } catch (err) {
      console.error('Error initializing user:', err);
      setState({
        userId: null,
        username: null,
        isLoading: false,
        isLoggedIn: false,
        error: err instanceof Error ? err.message : 'Failed to init user'
      });
    }
  }, [API_URL]);

  // Clear user (logout)
  const clearUser = useCallback(async () => {
    await AsyncStorage.multiRemove([USER_ID_KEY, USERNAME_KEY]);
    setState({ userId: null, username: null, isLoading: false, isLoggedIn: false, error: null });
  }, []);

  // Check for existing user on mount
  useEffect(() => {
    checkExistingUser();
  }, [checkExistingUser]);

  return {
    ...state,
    initUser,
    clearUser,
    refreshUser: checkExistingUser,
  };
}
