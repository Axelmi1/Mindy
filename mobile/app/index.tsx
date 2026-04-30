import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';

/**
 * Root index - sends logged-in users to the main tabs and new users to
 * onboarding. Previously redirected everyone to /onboarding unconditionally
 * (a TODO left over from testing), which forced returning users to redo the
 * whole flow on every cold start.
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

  return <Redirect href={isLoggedIn ? '/(tabs)' : '/onboarding'} />;
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
