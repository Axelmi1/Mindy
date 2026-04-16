import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useSoundInitializer } from '@/hooks/useSound';
import { useNotificationInitializer } from '@/hooks/useNotifications';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUser } from '@/hooks/useUser';
import { initializeABTest } from '@/services/abtest';

import '../global.css';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * Root Layout
 * Sets up the app theme, fonts, and navigation structure
 */
export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState<Error | null>(null);

  // Get user ID for service initialization
  const { userId } = useUser();

  // Initialize services
  const soundReady = useSoundInitializer();
  const notificationsReady = useNotificationInitializer(userId);
  useAnalytics(userId);

  // Initialize A/B test service once userId is available
  useEffect(() => {
    if (userId) {
      initializeABTest(userId).catch((e) =>
        console.warn('[ABTest] Init error:', e),
      );
    }
  }, [userId]);

  // ── Deep link handler ─────────────────────────────────────────────────────
  const handleDeepLink = useCallback((url: string) => {
    try {
      const parsed = Linking.parse(url);
      const { scheme, hostname, path, queryParams } = parsed;
      console.log('[DeepLink] Received:', url, { scheme, hostname, path, queryParams });

      // mindy://profile/:username  → navigate to profile tab
      if (hostname === 'profile' || path?.startsWith('profile/')) {
        router.push('/(tabs)/profile' as any);
        return;
      }

      // mindy://lesson/:id  → navigate directly to lesson
      if (hostname === 'lesson' || path?.startsWith('lesson/')) {
        const lessonId = path?.replace('lesson/', '') ?? queryParams?.id;
        if (lessonId) router.push(`/lesson/${lessonId}` as any);
        return;
      }

      // mindy://leaderboard  → open leaderboard tab
      if (hostname === 'leaderboard') {
        router.push('/(tabs)/leaderboard' as any);
        return;
      }

      // mindy://challenge  → open daily challenge
      if (hostname === 'challenge') {
        router.push('/daily-challenge');
        return;
      }

      // mindy://friends  → open friends screen
      if (hostname === 'friends') {
        router.push('/friends' as any);
        return;
      }

      // mindy://achievements  → open achievements screen
      if (hostname === 'achievements') {
        router.push('/achievements' as any);
        return;
      }

      // mindy://settings  → open settings screen
      if (hostname === 'settings') {
        router.push('/settings' as any);
        return;
      }

      // mindy://challenges  → open challenges screen
      if (hostname === 'challenges') {
        router.push('/challenges' as any);
        return;
      }
    } catch (e) {
      console.warn('[DeepLink] Failed to handle URL:', url, e);
    }
  }, []);

  useEffect(() => {
    // Handle app opened from a deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle deep links while app is running (warm start)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [handleDeepLink]);

  // Load custom fonts
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Try loading fonts - will fail gracefully if not present
          'JetBrainsMono': require('../assets/fonts/JetBrainsMono-Regular.ttf'),
          'JetBrainsMono-Bold': require('../assets/fonts/JetBrainsMono-Bold.ttf'),
          'Inter': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
          'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
          'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        // Fonts not found - use system fonts
        console.warn('[MINDY] Custom fonts not loaded, using system fonts:', error);
        setFontError(error as Error);
        setFontsLoaded(true); // Continue anyway with system fonts
      }
    }

    loadFonts();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Don't render until fonts are loaded (or failed to load)
  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <StatusBar style="light" backgroundColor="#0D1117" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0D1117' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="onboarding/index"
            options={{
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              animation: 'fade',
            }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="lesson/[id]"
            options={{
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="admin"
            options={{
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </View>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
