import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { useSoundInitializer } from '@/hooks/useSound';
import { useNotificationInitializer } from '@/hooks/useNotifications';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useUser } from '@/hooks/useUser';

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
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}
