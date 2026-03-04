import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';

/**
 * Root index - handles auth redirect
 */
export default function RootIndex() {
  const { isLoading, isLoggedIn } = useUser();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Icon name="brain" size={40} color="#39FF14" />
        </View>
        <Text style={styles.appName}>MINDY</Text>
        <ActivityIndicator color="#39FF14" style={styles.loader} />
      </View>
    );
  }

  // TODO: Remove this for production - always show onboarding for testing
  return <Redirect href="/onboarding" />;

  // Redirect based on auth state
  // if (isLoggedIn) {
  //   return <Redirect href="/(tabs)" />;
  // }
  // return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#161B22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#39FF14',
    marginBottom: 16,
  },
  logo: {
    fontSize: 40,
  },
  appName: {
    fontFamily: 'JetBrainsMono',
    fontSize: 24,
    fontWeight: '700',
    color: '#39FF14',
    letterSpacing: 3,
  },
  loader: {
    marginTop: 24,
  },
});
