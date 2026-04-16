/**
 * Notification Preferences Screen
 *
 * Full UI for toggling push notification types and setting reminder hour.
 * Wired to backend via notificationsApi.getPreferences / updatePreferences.
 *
 * Dark theme #0D1117 — consistent with app design system.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { notificationsApi, NotificationPreferences } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PrefToggle {
  key: keyof Pick<
    NotificationPreferences,
    'streakReminder' | 'dailyChallenge' | 'inactivityReminder' | 'levelUpCelebration' | 'streakMilestone'
  >;
  label: string;
  description: string;
  emoji: string;
}

const PREF_TOGGLES: PrefToggle[] = [
  {
    key: 'streakReminder',
    label: 'Rappel de streak',
    description: 'Notification si tu n\'as pas encore joué aujourd\'hui',
    emoji: '🔥',
  },
  {
    key: 'dailyChallenge',
    label: 'Défi quotidien',
    description: 'Rappel pour compléter ton défi quotidien',
    emoji: '🎯',
  },
  {
    key: 'inactivityReminder',
    label: 'Rappel d\'inactivité',
    description: 'Notification si tu n\'as pas joué depuis 2–3 jours',
    emoji: '💤',
  },
  {
    key: 'levelUpCelebration',
    label: 'Level Up & Succès',
    description: 'Célébration quand tu montes de niveau ou débloque un succès',
    emoji: '🏆',
  },
  {
    key: 'streakMilestone',
    label: 'Paliers de streak',
    description: 'Félicitations pour 7j, 30j, 100j de streak',
    emoji: '⚡',
  },
];

// ─── Hour options ─────────────────────────────────────────────────────────────

const HOUR_OPTIONS = [6, 7, 8, 9, 10, 12, 16, 17, 18, 19, 20, 21, 22];
const hourLabel = (h: number) => {
  const ampm = h < 12 ? 'AM' : 'PM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${ampm}`;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationPreferencesScreen() {
  const { userId } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load preferences ────────────────────────────────────────────────────

  const loadPrefs = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await notificationsApi.getPreferences(userId);
      if (res.success && res.data) {
        setPrefs(res.data);
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
      Alert.alert('Erreur', 'Impossible de charger les préférences.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  // ── Auto-save with 600ms debounce ────────────────────────────────────────

  const persistPrefs = useCallback(
    async (updated: NotificationPreferences) => {
      if (!userId) return;
      setIsSaving(true);
      setSaved(false);
      try {
        await notificationsApi.updatePreferences(userId, updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        console.error('Failed to save notification preferences:', err);
        Alert.alert('Erreur', 'Impossible de sauvegarder les préférences.');
      } finally {
        setIsSaving(false);
      }
    },
    [userId],
  );

  const handleToggle = (key: PrefToggle['key'], value: boolean) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Debounced save
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => persistPrefs(updated), 600);
  };

  const handleHourSelect = (hour: number) => {
    if (!prefs) return;
    const updated = { ...prefs, reminderHour: hour };
    setPrefs(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => persistPrefs(updated), 600);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="chevron-left" size={22} color="#C9D1D9" />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.saveIndicator}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#8B949E" />
          ) : saved ? (
            <Icon name="check" size={18} color="#39FF14" />
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#39FF14" size="large" />
        </View>
      ) : !prefs ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Impossible de charger les préférences.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info banner */}
          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.infoBanner}>
            <Text style={styles.infoEmoji}>📲</Text>
            <Text style={styles.infoText}>
              Personnalise quelles notifications tu reçois. Les modifications sont sauvegardées automatiquement.
            </Text>
          </Animated.View>

          {/* Toggle section */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>Types de notifications</Text>

            {PREF_TOGGLES.map((toggle, i) => (
              <View
                key={toggle.key}
                style={[
                  styles.toggleRow,
                  i < PREF_TOGGLES.length - 1 && styles.toggleRowBorder,
                ]}
              >
                <View style={styles.toggleLeft}>
                  <Text style={styles.toggleEmoji}>{toggle.emoji}</Text>
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleLabel}>{toggle.label}</Text>
                    <Text style={styles.toggleDesc}>{toggle.description}</Text>
                  </View>
                </View>
                <Switch
                  value={prefs[toggle.key] as boolean}
                  onValueChange={(v) => handleToggle(toggle.key, v)}
                  trackColor={{ false: '#30363D', true: '#39FF14' }}
                  thumbColor={prefs[toggle.key] ? '#0D1117' : '#8B949E'}
                  ios_backgroundColor="#30363D"
                />
              </View>
            ))}
          </Animated.View>

          {/* Reminder hour section */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>Heure du rappel streak</Text>
            <Text style={styles.sectionSubtitle}>
              À quelle heure veux-tu être rappelé si tu n'as pas encore joué ?
            </Text>

            <View style={styles.hourGrid}>
              {HOUR_OPTIONS.map((h) => {
                const isSelected = prefs.reminderHour === h;
                return (
                  <Pressable
                    key={h}
                    style={[styles.hourChip, isSelected && styles.hourChipSelected]}
                    onPress={() => handleHourSelect(h)}
                  >
                    <Text style={[styles.hourChipText, isSelected && styles.hourChipTextSelected]}>
                      {hourLabel(h)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Challenge notifications info */}
          <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>⚔️ Défis entre amis</Text>
            <Text style={styles.infoCardText}>
              Les notifications de défis (reçus et acceptés) sont toujours actives pour ne manquer aucune invitation.
            </Text>
          </Animated.View>

          {/* Referral info */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>🎁 Parrainages</Text>
            <Text style={styles.infoCardText}>
              Tu seras notifié quand un ami rejoint Mindy via ton code de parrainage.
            </Text>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#E6EDF3',
  },
  saveIndicator: {
    width: 28,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#8B949E',
    fontFamily: 'Inter',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 14,
  },
  infoEmoji: {
    fontSize: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#8B949E',
    lineHeight: 19,
  },
  section: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    overflow: 'hidden',
    padding: 16,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#8B949E',
    marginBottom: 12,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  toggleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toggleEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#E6EDF3',
  },
  toggleDesc: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#8B949E',
    lineHeight: 16,
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  hourChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  hourChipSelected: {
    backgroundColor: 'rgba(57,255,20,0.12)',
    borderColor: '#39FF14',
  },
  hourChipText: {
    fontSize: 13,
    fontFamily: 'JetBrainsMono',
    color: '#8B949E',
    fontWeight: '600',
  },
  hourChipTextSelected: {
    color: '#39FF14',
  },
  infoCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262D',
    padding: 14,
    gap: 6,
  },
  infoCardTitle: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#E6EDF3',
  },
  infoCardText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#8B949E',
    lineHeight: 17,
  },
});
