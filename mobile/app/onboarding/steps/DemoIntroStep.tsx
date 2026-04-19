import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const CHECKLIST = [
  'Takes 30 seconds',
  'Learn real concepts',
  'Earn your first XP',
];

export function DemoIntroStep() {
  const next = useOnboardingStore((s) => s.next);

  return (
    <OnboardingScreen
      animationKey="demo_intro"
      footer={<PrimaryButton onPress={next}>Let's go</PrimaryButton>}
    >
      <View style={styles.icon}><Icon name="play" size={64} color="#39FF14" /></View>
      <Text style={styles.title}>Let's try a quick lesson!</Text>
      <Text style={styles.subtitle}>3 easy questions to see how MINDY works.{'\n'}No pressure, just have fun!</Text>

      <View style={styles.checklist}>
        {CHECKLIST.map((c) => (
          <View key={c} style={styles.row}>
            <Icon name="check" size={16} color="#39FF14" />
            <Text style={styles.rowText}>{c}</Text>
          </View>
        ))}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  checklist: { backgroundColor: '#161B22', borderRadius: 16, padding: 20, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { fontFamily: 'Inter', fontSize: 15, color: '#E6EDF3' },
});
