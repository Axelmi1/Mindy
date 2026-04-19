import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MindyMascot } from '@/components/mindy';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const VALUE_PROPS = [
  { icon: '🧠', label: 'Crypto × Finance' },
  { icon: '⚡', label: '5 min / day' },
  { icon: '🎮', label: 'Interactive' },
];

export function WelcomeStep() {
  const next = useOnboardingStore((s) => s.next);

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    next();
  };

  const handleLogin = () => router.replace('/login');

  return (
    <OnboardingScreen
      animationKey="welcome"
      footer={
        <>
          <PrimaryButton onPress={handleStart}>Get started</PrimaryButton>
          <PrimaryButton onPress={handleLogin} variant="ghost">I already have an account</PrimaryButton>
        </>
      }
    >
      <Animated.View entering={FadeIn.duration(600)} style={styles.hero}>
        <MindyMascot mood="neutral" size={140} />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200)} style={styles.texts}>
        <Text style={styles.title}>Learn to speak money</Text>
        <Text style={styles.subtitle}>Master crypto & finance in just 5 minutes a day</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)} style={styles.pills}>
        {VALUE_PROPS.map((p) => (
          <View key={p.label} style={styles.pill}>
            <Text style={styles.pillIcon}>{p.icon}</Text>
            <Text style={styles.pillLabel}>{p.label}</Text>
          </View>
        ))}
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 32 },
  texts: { alignItems: 'center', marginBottom: 32 },
  title: { fontFamily: 'Inter', fontSize: 30, fontWeight: '800', color: '#E6EDF3', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#161B22', borderRadius: 20, borderWidth: 1, borderColor: '#30363D' },
  pillIcon: { fontSize: 14 },
  pillLabel: { fontFamily: 'Inter', fontSize: 12, color: '#E6EDF3', fontWeight: '600' },
});
