import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MindyTurn } from '../components/MindyTurn';
import { PlanBuilder } from '../components/PlanBuilder';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { finalizeOnboarding } from '../hooks/finalizeOnboarding';

const REMINDER_OPTS = [
  { hour: 9, label: 'Matin · 09:00' },
  { hour: 12, label: 'Midi · 12:00' },
  { hour: 20, label: 'Soir · 20:00' },
];

export function PlanStep() {
  const domain = useOnboardingStore((s) => s.domain);
  const goal = useOnboardingStore((s) => s.goal);
  const dailyMinutes = useOnboardingStore((s) => s.dailyMinutes);
  const setNotifications = useOnboardingStore((s) => s.setNotifications);
  const setMood = useOnboardingStore((s) => s.setMood);

  const [hour, setHour] = useState<number>(dailyMinutes === 5 ? 9 : dailyMinutes === 10 ? 12 : 20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setMood('thinking'); }, [setMood]);

  const planLines = useMemo(() => [
    `domaine: ${domain ?? 'CRYPTO'}`,
    `objectif: ${goal ?? 'understand'}`,
    `rythme: ${dailyMinutes ?? 5} min/jour`,
    'parcours généré ✓',
  ], [domain, goal, dailyMinutes]);

  const finish = async (notif: boolean) => {
    setError(null);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNotifications(notif, notif ? hour : null);
    try {
      await finalizeOnboarding();
    } catch (err) {
      setError((err as Error).message || String(err));
      setLoading(false);
    }
  };

  return (
    <MindyTurn
      turnKey="plan"
      mood="thinking"
      message="Je te construis un parcours sur-mesure…"
      ctaLabel="Activer le rappel quotidien"
      onCta={() => finish(true)}
      ctaLoading={loading}
      secondary={
        <TouchableOpacity onPress={() => finish(false)} disabled={loading} style={styles.ghost}>
          <Text style={styles.ghostText}>Plus tard</Text>
        </TouchableOpacity>
      }
    >
      <PlanBuilder lines={planLines} />

      <Text style={styles.label}>Je te rappelle quand ?</Text>
      <View style={styles.chips}>
        {REMINDER_OPTS.map((o) => (
          <TouchableOpacity
            key={o.hour}
            activeOpacity={0.8}
            onPress={() => setHour(o.hour)}
            style={hour === o.hour ? styles.chipOn : styles.chip}
          >
            <Text style={hour === o.hour ? styles.chipTextOn : styles.chipText}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Vérifie ta connexion. Le serveur peut mettre ~40s à se réveiller.</Text>
          <TouchableOpacity onPress={() => finish(false)} style={styles.retry}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </MindyTurn>
  );
}

const chipBase = {
  paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999,
  borderWidth: 2, borderColor: '#30363D', backgroundColor: '#161B22',
};
const styles = StyleSheet.create({
  label: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', marginTop: 20, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: chipBase,
  chipOn: { ...chipBase, borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.1)' },
  chipText: { fontFamily: 'Inter', fontSize: 13, color: '#E6EDF3' },
  chipTextOn: { fontFamily: 'Inter', fontSize: 13, color: '#39FF14', fontWeight: '700' },
  ghost: { paddingVertical: 14, alignItems: 'center' },
  ghostText: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', fontWeight: '500' },
  errorBox: { marginTop: 20, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F85149', backgroundColor: 'rgba(248,81,73,0.1)' },
  errorText: { fontFamily: 'Inter', fontSize: 13, color: '#F85149', textAlign: 'center' },
  errorHint: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', textAlign: 'center', marginTop: 4 },
  retry: { marginTop: 10, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, backgroundColor: '#39FF14' },
  retryText: { fontFamily: 'Inter', fontSize: 14, fontWeight: '700', color: '#0D1117' },
});
