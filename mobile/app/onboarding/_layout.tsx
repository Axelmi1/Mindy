import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ProgressBar } from './components/ProgressBar';
import { MindyMascot } from '@/components/mindy';
import { Icon } from '@/components/ui/Icon';
import { useOnboardingStore } from './hooks/useOnboardingStore';

export default function OnboardingLayout() {
  const mood = useOnboardingStore((s) => s.mood);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const back = useOnboardingStore((s) => s.back);
  // Mascotte plus grande sur l'accroche.
  const size = currentStep === 'hello' ? 150 : 96;
  // Pas de retour depuis le tout premier écran.
  const canGoBack = currentStep !== 'hello';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity
            onPress={back}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Revenir à l'étape précédente"
          >
            <Icon name="arrow-left" size={24} color="#E6EDF3" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>
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
  header: { height: 36, justifyContent: 'center' },
  backBtn: { width: 44, height: 36, justifyContent: 'center', paddingLeft: 16 },
  mascotWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
});
