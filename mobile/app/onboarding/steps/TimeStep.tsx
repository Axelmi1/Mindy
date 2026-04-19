import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const TIMES = [
  { minutes: 5 as const,  label: '5',  sublabel: 'Casual' },
  { minutes: 10 as const, label: '10', sublabel: 'Regular' },
  { minutes: 15 as const, label: '15', sublabel: 'Serious' },
];

export function TimeStep() {
  const dailyMinutes = useOnboardingStore((s) => s.dailyMinutes);
  const setDailyMinutes = useOnboardingStore((s) => s.setDailyMinutes);
  const next = useOnboardingStore((s) => s.next);

  const pick = async (m: 5 | 10 | 15) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDailyMinutes(m);
  };

  return (
    <OnboardingScreen
      animationKey="time"
      footer={<PrimaryButton onPress={next} disabled={!dailyMinutes}>Continue</PrimaryButton>}
    >
      <Text style={styles.title}>Set a daily goal</Text>
      <Text style={styles.subtitle}>Consistency beats intensity.</Text>

      <View style={styles.cards}>
        {TIMES.map((t) => (
          <Pressable
            key={t.minutes}
            style={[styles.card, dailyMinutes === t.minutes && styles.selected]}
            onPress={() => pick(t.minutes)}
          >
            <Text style={styles.big}>{t.label}</Text>
            <Text style={styles.unit}>min/day</Text>
            <Text style={styles.sub}>{t.sublabel}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.note}>
        <Icon name="lightbulb" size={18} color="#FFD700" />
        <Text style={styles.noteText}>Most successful learners start with 5 minutes</Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', marginBottom: 32 },
  cards: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  card: { flex: 1, backgroundColor: '#161B22', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#30363D' },
  selected: { borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.1)' },
  big: { fontFamily: 'JetBrainsMono', fontSize: 32, fontWeight: '700', color: '#39FF14' },
  unit: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E' },
  sub: { fontFamily: 'Inter', fontSize: 11, color: '#484F58', marginTop: 8 },
  note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  noteText: { fontFamily: 'Inter', fontSize: 13, color: '#8B949E' },
});
