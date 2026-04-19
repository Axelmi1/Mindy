import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MindyMascot } from '@/components/mindy';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const VALUE_PROPS = [
  { icon: '🧠', label: 'Crypto × Finance' },
  { icon: '⚡', label: '5 min / day' },
  { icon: '🎮', label: 'Interactive' },
];

export function WelcomeStep() {
  const next = useOnboardingStore((s) => s.next);
  const insets = useSafeAreaInsets();

  const handleStart = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    next();
  };

  const handleLogin = () => router.replace('/login');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
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
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.btnPrimaryText}>Get started</Text>
        </Pressable>

        <Pressable
          onPress={handleLogin}
          style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.btnGhostText}>I already have an account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: 32 },
  texts: { alignItems: 'center', marginBottom: 32 },
  title: {
    fontFamily: 'Inter',
    fontSize: 30,
    fontWeight: '800',
    color: '#E6EDF3',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#8B949E',
    textAlign: 'center',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#161B22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  pillIcon: { fontSize: 14 },
  pillLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#E6EDF3',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  btnPrimary: {
    backgroundColor: '#39FF14',
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: 12,
  },
  btnPrimaryText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  btnGhost: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
  },
});
