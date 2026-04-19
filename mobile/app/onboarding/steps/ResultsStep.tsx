import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MindyMascot } from '@/components/mindy';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

export function ResultsStep() {
  const demoScore = useOnboardingStore((s) => s.demoScore);
  const next = useOnboardingStore((s) => s.next);

  const percentage = Math.round((demoScore / 3) * 100);
  const title = percentage >= 66 ? 'Amazing!' : percentage >= 33 ? 'Good job!' : 'Nice try!';
  const mood = percentage >= 33 ? 'hype' : 'neutral';

  return (
    <OnboardingScreen
      animationKey="results"
      footer={<PrimaryButton onPress={next}>Save my progress</PrimaryButton>}
    >
      <Animated.View entering={FadeIn.duration(400)} style={styles.card}>
        <MindyMascot mood={mood} size={120} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.score}>{demoScore}/3 correct</Text>

        <View style={styles.xpBox}>
          <Text style={styles.xpAmount}>+{demoScore * 10} XP</Text>
          <Text style={styles.xpLabel}>earned</Text>
        </View>
      </Animated.View>

      <View style={styles.insight}>
        <Text style={styles.insightText}>
          You're already learning! Imagine what you'll know after a week of daily practice.
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#161B22', borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 2, borderColor: '#39FF14', marginBottom: 24 },
  title: { fontFamily: 'Inter', fontSize: 28, fontWeight: '700', color: '#E6EDF3', marginTop: 12, marginBottom: 8 },
  score: { fontFamily: 'JetBrainsMono', fontSize: 16, color: '#8B949E', marginBottom: 24 },
  xpBox: { backgroundColor: '#0D1117', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  xpAmount: { fontFamily: 'JetBrainsMono', fontSize: 24, fontWeight: '700', color: '#FFD700' },
  xpLabel: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E' },
  insight: { backgroundColor: '#161B22', borderRadius: 12, padding: 16 },
  insightText: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', textAlign: 'center', lineHeight: 20 },
});
