import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { ProgressBar } from './components/ProgressBar';
import { MindyMascot } from '@/components/mindy';
import { useOnboardingStore } from './hooks/useOnboardingStore';

export default function OnboardingLayout() {
  const mood = useOnboardingStore((s) => s.mood);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  // Mascotte plus grande sur l'accroche.
  const size = currentStep === 'hello' ? 150 : 96;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ProgressBar />
      <View style={styles.mascotWrap}>
        <MindyMascot mood={mood} size={size} />
      </View>
      <View style={styles.flex1}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117', paddingTop: 60 },
  flex1: { flex: 1 },
  mascotWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
});
