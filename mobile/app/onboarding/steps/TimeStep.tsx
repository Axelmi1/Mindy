import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const TIMES = [
  { minutes: 5 as const,  label: '5',  sublabel: 'Casual' },
  { minutes: 10 as const, label: '10', sublabel: 'Regular' },
  { minutes: 15 as const, label: '15', sublabel: 'Serious' },
];

const BUILD_TAG = 'build 2026-04-21-inline';

export function TimeStep() {
  const dailyMinutes = useOnboardingStore((s) => s.dailyMinutes);
  const setDailyMinutes = useOnboardingStore((s) => s.setDailyMinutes);
  const next = useOnboardingStore((s) => s.next);
  const insets = useSafeAreaInsets();

  const pick = async (m: 5 | 10 | 15) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDailyMinutes(m);
  };

  const isDisabled = !dailyMinutes;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* DEBUG BANNER — remove once button renders correctly */}
      <View style={styles.debugBanner}>
        <Text style={styles.debugText}>{BUILD_TAG}</Text>
      </View>

      <View style={styles.content}>
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
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Pressable
          onPress={next}
          disabled={isDisabled}
          style={isDisabled ? styles.btnDisabled : styles.btnActive}
        >
          <Text style={isDisabled ? styles.btnDisabledText : styles.btnActiveText}>
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  debugBanner: {
    backgroundColor: '#F7C843',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  debugText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#0D1117',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    justifyContent: 'center',
  },
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
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  btnActive: {
    backgroundColor: '#39FF14',
    borderRadius: 999,
    minHeight: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  btnActiveText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  btnDisabled: {
    backgroundColor: 'transparent',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#39FF14',
    minHeight: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  btnDisabledText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#39FF14',
  },
});
