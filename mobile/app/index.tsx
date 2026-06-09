import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';

/**
 * Root index - sends logged-in users to the main tabs and logged-out users to
 * /login. The login screen offers a "Commencer à apprendre" CTA that leads to
 * onboarding, so new users reach onboarding through /login rather than being
 * redirected there directly at cold start.
 */
export default function RootIndex() {
  const { isLoading, isLoggedIn } = useUser();

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

  return <Redirect href={isLoggedIn ? '/(tabs)' : '/login'} />;
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
