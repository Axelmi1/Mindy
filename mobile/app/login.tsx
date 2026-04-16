import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';
import { referralsApi, usersApi } from '@/api/client';

/**
 * Login Screen - Entry point for authentication
 */
export default function LoginScreen() {
  const { initUser, clearUser, isLoggedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [showUsernameLogin, setShowUsernameLogin] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await initUser();

      // Apply referral code if provided
      if (referralCode.trim()) {
        try {
          // Get the userId from AsyncStorage (it was just set by initUser)
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const userId = await AsyncStorage.getItem('@mindy/user_id');
          if (userId) {
            const result = await referralsApi.applyCode(userId, referralCode.trim().toUpperCase());
            if (result.success && result.data) {
              Alert.alert(
                'Welcome Bonus!',
                `You earned ${result.data.xpAwarded} XP from the referral code!`,
                [{ text: 'Awesome!' }]
              );
            }
          }
        } catch (referralErr) {
          console.log('Referral code not applied:', referralErr);
          // Don't block login if referral fails
        }
      }

      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error creating anonymous user:', err);
      setIsLoading(false);
    }
  };

  const handleNewTestUser = async () => {
    setIsCreatingNew(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Clear existing user first
      await clearUser();
      // Create new user
      await initUser();
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error creating new test user:', err);
      setIsCreatingNew(false);
    }
  };

  const handleUsernameLogin = async () => {
    const trimmed = loginUsername.trim();
    if (!trimmed) return;

    setIsLoginLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await usersApi.getByUsername(trimmed);
      if (result.success && result.data) {
        await AsyncStorage.multiSet([
          ['@mindy/user_id', result.data.id],
          ['@mindy/username', result.data.username],
        ]);
        router.replace('/(tabs)');
      } else {
        Alert.alert('User not found', `No account found for "@${trimmed}"\n\nGo back to create a new account.`, [{ text: 'OK' }]);
      }
    } catch {
      Alert.alert('Error', 'Could not connect to the server. Check your connection.', [{ text: 'OK' }]);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement Google Sign In
    alert('Google Sign In coming soon!');
  };

  const handleAppleLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement Apple Sign In
    alert('Apple Sign In coming soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo & Branding */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Icon name="brain" size={48} color="#39FF14" />
          </View>
          <Text style={styles.appName}>MINDY</Text>
          <Text style={styles.tagline}>Learn Crypto & Finance</Text>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.welcomeText}>
            Master trading, crypto, and personal finance with bite-sized lessons and interactive games.
          </Text>
        </Animated.View>

        {/* Auth Buttons */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.authSection}>
          {/* Anonymous Button - Primary */}
          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleAnonymousLogin}
            disabled={isLoading || isCreatingNew}
          >
            {isLoading ? (
              <ActivityIndicator color="#0D1117" />
            ) : (
              <>
                <Icon name="rocket" size={20} color="#0D1117" />
                <Text style={styles.buttonPrimaryText}>
                  {isLoggedIn ? 'Continue Learning' : 'Start Learning'}
                </Text>
              </>
            )}
          </Pressable>

          {/* Referral Code Input */}
          {!showReferralInput ? (
            <Pressable
              style={styles.referralToggle}
              onPress={() => setShowReferralInput(true)}
            >
              <Icon name="gift" size={16} color="#58A6FF" />
              <Text style={styles.referralToggleText}>Have a referral code?</Text>
            </Pressable>
          ) : (
            <View style={styles.referralInputContainer}>
              <Text style={styles.referralLabel}>Referral Code (optional)</Text>
              <TextInput
                style={styles.referralInput}
                value={referralCode}
                onChangeText={(text) => setReferralCode(text.toUpperCase())}
                placeholder="ABCD12"
                placeholderTextColor="#484F58"
                autoCapitalize="characters"
                maxLength={8}
              />
            </View>
          )}

          {/* New Test User Button - For testing */}
          <Pressable
            style={[styles.button, styles.buttonTest]}
            onPress={handleNewTestUser}
            disabled={isLoading || isCreatingNew}
          >
            {isCreatingNew ? (
              <ActivityIndicator color="#39FF14" />
            ) : (
              <>
                <Icon name="refresh" size={20} color="#8B949E" />
                <Text style={styles.buttonTestText}>New Test User</Text>
              </>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or login with username</Text>
            <View style={styles.divider} />
          </View>

          {/* Username Login */}
          {!showUsernameLogin ? (
            <Pressable
              style={[styles.button, styles.buttonTest]}
              onPress={() => setShowUsernameLogin(true)}
            >
              <Icon name="user" size={20} color="#8B949E" />
              <Text style={styles.buttonTestText}>Login with @username</Text>
            </Pressable>
          ) : (
            <View style={{ gap: 10 }}>
              <View style={styles.usernameLoginRow}>
                <Text style={styles.usernameAtSign}>@</Text>
                <TextInput
                  style={styles.usernameLoginInput}
                  placeholder="your_username"
                  placeholderTextColor="#484F58"
                  value={loginUsername}
                  onChangeText={setLoginUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleUsernameLogin}
                  autoFocus
                />
              </View>
              <Pressable
                style={[styles.button, styles.buttonPrimary, (!loginUsername.trim() || isLoginLoading) && { opacity: 0.5 }]}
                onPress={handleUsernameLogin}
                disabled={!loginUsername.trim() || isLoginLoading}
              >
                {isLoginLoading ? (
                  <ActivityIndicator color="#0D1117" />
                ) : (
                  <Text style={styles.buttonPrimaryText}>Login</Text>
                )}
              </Pressable>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Admin Mode */}
      <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.adminSection}>
        <Pressable
          style={styles.adminButton}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await AsyncStorage.setItem('@mindy/admin_mode', 'true');
            await initUser();
            router.replace('/(tabs)');
          }}
        >
          <Text style={styles.adminButtonText}>🛠 Admin</Text>
        </Pressable>
      </Animated.View>

      {/* Footer */}
      <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our{' '}
          <Text style={styles.footerLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#161B22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#39FF14',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 48,
  },
  appName: {
    fontFamily: 'JetBrainsMono',
    fontSize: 36,
    fontWeight: '700',
    color: '#39FF14',
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    marginTop: 4,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 12,
  },
  welcomeText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  authSection: {
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  buttonPrimary: {
    backgroundColor: '#39FF14',
  },
  buttonPrimaryText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  buttonTest: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#30363D',
  },
  buttonTestText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#8B949E',
  },
  referralToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  referralToggleText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#58A6FF',
  },
  referralInputContainer: {
    gap: 8,
  },
  referralLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
  referralInput: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: 'JetBrainsMono',
    fontSize: 18,
    color: '#E6EDF3',
    textAlign: 'center',
    letterSpacing: 4,
  },
  buttonIcon: {
    fontSize: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#30363D',
  },
  dividerText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#484F58',
    paddingHorizontal: 16,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonSocial: {
    flex: 1,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  buttonSocialText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  adminSection: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  adminButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: 'transparent',
  },
  adminButtonText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#484F58',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#484F58',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#58A6FF',
  },
  usernameLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#39FF14',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  usernameAtSign: {
    fontFamily: 'JetBrainsMono',
    fontSize: 18,
    color: '#39FF14',
    fontWeight: '700',
  },
  usernameLoginInput: {
    flex: 1,
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    color: '#E6EDF3',
    padding: 0,
  },
});
