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
  const [error, setError] = useState<string | null>(null);

  const runFinalize = async (notifGranted: boolean) => {
    try {
      setNotifications(notifGranted, notifGranted ? hour : null);
      await finalizeOnboarding();
    } catch (err) {
      const msg = (err as Error).message || String(err);
      console.error('[NotificationsStep] finalize failed:', err);
      setError(msg);
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    setError(null);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let granted = false;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      granted = status === 'granted';
    } catch (err) {
      console.error('Notifications permission error:', err);
    }
    await runFinalize(granted);
  };

  const handleSkip = async () => {
    setError(null);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await runFinalize(false);
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

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Vérifie ta connexion et réessaie.</Text>
        </View>
      )}
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
  errorBox: { marginTop: 24, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F85149', backgroundColor: 'rgba(248,81,73,0.1)' },
  errorText: { fontFamily: 'Inter', fontSize: 13, color: '#F85149', textAlign: 'center' },
  errorHint: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', textAlign: 'center', marginTop: 4 },
});
