import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';
import { useOnboardingStore } from './onboarding/hooks/useOnboardingStore';

const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL || 'test@mindy.app';
const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_PASSWORD || 'test1234';

/**
 * Login screen — primary CTA starts onboarding (new user); returning users
 * sign in with email + password. Admin button quick-logs into the dev account.
 */
export default function LoginScreen() {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartLearning = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Always start a brand-new onboarding run — wipe any stale persisted state
    // (e.g. left by an older app version) so we never resume past the Signup step.
    useOnboardingStore.getState().reset();
    router.replace('/onboarding');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Connexion échouée', 'Email ou mot de passe incorrect.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdmin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      await AsyncStorage.setItem('@mindy/admin_mode', 'true');
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Admin', 'Compte admin indisponible (vérifie le seed / les identifiants).', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.content}>
        {/* Logo & Branding */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Icon name="brain" size={48} color="#39FF14" />
          </View>
          <Text style={styles.appName}>MINDY</Text>
          <Text style={styles.tagline}>Apprends la crypto & la finance</Text>
        </Animated.View>

        {/* Welcome */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Bienvenue</Text>
          <Text style={styles.welcomeText}>
            Deviens bon en trading, crypto et finances perso avec des mini-leçons interactives.
          </Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.authSection}>
          {/* Primary: start learning → onboarding */}
          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleStartLearning} disabled={isLoading}>
            <Icon name="rocket" size={20} color="#0D1117" />
            <Text style={styles.buttonPrimaryText}>Commencer à apprendre</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>déjà un compte ?</Text>
            <View style={styles.divider} />
          </View>

          {/* Login form */}
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#484F58"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor="#484F58"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />
          <Pressable
            style={[styles.button, styles.buttonSecondary, (!email.trim() || !password || isLoading) && { opacity: 0.5 }]}
            onPress={handleLogin}
            disabled={!email.trim() || !password || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#E6EDF3" />
            ) : (
              <Text style={styles.buttonSecondaryText}>Se connecter</Text>
            )}
          </Pressable>
        </Animated.View>
      </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Admin */}
      <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.adminSection}>
        <Pressable style={styles.adminButton} onPress={handleAdmin} disabled={isLoading}>
          <Text style={styles.adminButtonText}>🛠 Admin</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 100, height: 100, borderRadius: 24, backgroundColor: '#161B22',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#39FF14', marginBottom: 16,
  },
  appName: { fontFamily: 'JetBrainsMono', fontSize: 36, fontWeight: '700', color: '#39FF14', letterSpacing: 4 },
  tagline: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', marginTop: 4 },
  welcomeSection: { alignItems: 'center', marginBottom: 32 },
  welcomeTitle: { fontFamily: 'Inter', fontSize: 28, fontWeight: '700', color: '#E6EDF3', marginBottom: 12 },
  welcomeText: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  authSection: { gap: 12 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 10 },
  buttonPrimary: { backgroundColor: '#39FF14' },
  buttonPrimaryText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '700', color: '#0D1117' },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#30363D' },
  buttonSecondaryText: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#E6EDF3' },
  input: {
    backgroundColor: '#161B22', borderRadius: 12, borderWidth: 1, borderColor: '#30363D',
    paddingVertical: 14, paddingHorizontal: 16, fontFamily: 'Inter', fontSize: 15, color: '#E6EDF3',
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  divider: { flex: 1, height: 1, backgroundColor: '#30363D' },
  dividerText: { fontFamily: 'Inter', fontSize: 12, color: '#484F58', paddingHorizontal: 16 },
  adminSection: { alignItems: 'center', paddingBottom: 8 },
  adminButton: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
    borderColor: '#30363D', backgroundColor: 'transparent',
  },
  adminButtonText: { fontFamily: 'JetBrainsMono', fontSize: 11, color: '#484F58' },
});
