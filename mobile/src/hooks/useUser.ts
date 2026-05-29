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

  // Ré-utilise un user déjà créé (la CRÉATION se fait dans finalizeOnboarding).
  const initUser = useCallback(async () => {
    await checkExistingUser();
  }, [checkExistingUser]);

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
