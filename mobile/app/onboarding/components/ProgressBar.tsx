import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useOnboardingStore, getStepProgress } from '../hooks/useOnboardingStore';

export function ProgressBar() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  if (currentStep === 'welcome') return null;
  const pct = getStepProgress(currentStep);

  return (
    <Animated.View entering={FadeIn} style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 16 },
  track: { height: 6, backgroundColor: '#30363D', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#39FF14', borderRadius: 3 },
});
