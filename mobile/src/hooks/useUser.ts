import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@mindy/user_id';
const USERNAME_KEY = '@mindy/username';

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
        // Verify the user still exists in the database (with 5s timeout)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const verifyResponse = await fetch(`${API_URL}/users/${storedUserId}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

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

  // Create a new anonymous user
  const initUser = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // First check if we already have a valid user
      const storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
      if (storedUserId) {
        try {
          const verifyResponse = await fetch(`${API_URL}/users/${storedUserId}`);
          if (verifyResponse.ok) {
            setState({ userId: storedUserId, isLoading: false, isLoggedIn: true, error: null });
            return;
          }
        } catch {
          // Continue to create new user
        }
        await AsyncStorage.removeItem(USER_ID_KEY);
      }

      // Create new anonymous user
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `anon_${Date.now()}@mindy.app`,
          username: `anon_${Date.now().toString(36)}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const result = await response.json();
      const userId = result.data.id;
      const username = result.data.username ?? null;

      await AsyncStorage.multiSet([
        [USER_ID_KEY, userId],
        ...(username ? [[USERNAME_KEY, username] as [string, string]] : []),
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
