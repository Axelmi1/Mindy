import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { MindyMascot } from '@/components/mindy';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { finalizeOnboarding } from '../hooks/finalize';

const TIME_OPTS: { hour: number; label: string }[] = [
  { hour:  9, label: 'Morning · 09:00' },
  { hour: 12, label: 'Lunch · 12:00' },
  { hour: 20, label: 'Evening · 20:00' },
  { hour: 22, label: 'Night · 22:00' },
];

export function NotificationsStep() {
  const dailyMinutes = useOnboardingStore((s) => s.dailyMinutes);
  const setNotifications = useOnboardingStore((s) => s.setNotifications);
  const defaultHour = dailyMinutes === 5 ? 9 : dailyMinutes === 10 ? 12 : 20;
  const [hour, setHour] = useState<number>(defaultHour);
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setNotifications(granted, granted ? hour : null);
      await finalizeOnboarding();
    } catch (err) {
      console.error('Notifications permission error:', err);
      setNotifications(false, null);
      await finalizeOnboarding();
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications(false, null);
    await finalizeOnboarding();
  };

  return (
    <OnboardingScreen
      animationKey="notifications"
      footer={
        <>
          <PrimaryButton onPress={handleEnable} loading={loading}>
            Enable reminders
          </PrimaryButton>
          <PrimaryButton onPress={handleSkip} variant="ghost" disabled={loading}>
            Not now
          </PrimaryButton>
        </>
      }
    >
      <View style={styles.hero}>
        <MindyMascot mood="neutral" size={120} />
      </View>

      <Text style={styles.title}>Want me to remind you?</Text>
      <Text style={styles.subtitle}>Keep your streak alive with a daily nudge.</Text>

      <View style={styles.chips}>
        {TIME_OPTS.map((t) => (
          <Pressable
            key={t.hour}
            style={[styles.chip, hour === t.hour && styles.chipSelected]}
            onPress={() => setHour(t.hour)}
          >
            <Text style={[styles.chipText, hour === t.hour && styles.chipTextSelected]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', marginBottom: 32 },
  chips: { gap: 10 },
  chip: { padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#30363D', backgroundColor: '#161B22' },
  chipSelected: { borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.1)' },
  chipText: { fontFamily: 'Inter', fontSize: 15, color: '#E6EDF3', textAlign: 'center' },
  chipTextSelected: { color: '#39FF14', fontWeight: '700' },
});
