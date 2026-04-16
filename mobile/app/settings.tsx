import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/hooks/useSound';
import { usersApi } from '@/api/client';
import { Icon } from '@/components/ui/Icon';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { GOAL_OPTIONS, GoalValue } from '@/hooks/useDailyGoal';

// ─── Domain + Goal constants ────────────────────────────────────────────────

const DOMAIN_OPTIONS = [
  { value: 'CRYPTO',  label: 'Crypto',   emoji: '₿',  color: '#F7931A' },
  { value: 'FINANCE', label: 'Finance',  emoji: '📈', color: '#39FF14' },
  { value: 'TRADING', label: 'Trading',  emoji: '📊', color: '#58A6FF' },
  { value: 'BOTH',    label: 'Tout',     emoji: '🌐', color: '#A371F7' },
] as const;

const USER_GOAL_OPTIONS = [
  { value: 'invest',     label: 'Investir',          emoji: '💰' },
  { value: 'understand', label: 'Comprendre',         emoji: '🧠' },
  { value: 'career',     label: 'Carrière',           emoji: '🚀' },
  { value: 'curiosity',  label: 'Par curiosité',      emoji: '🔍' },
] as const;

type DomainValue = 'CRYPTO' | 'FINANCE' | 'TRADING' | 'BOTH';
type UserGoalValue = 'invest' | 'understand' | 'career' | 'curiosity';

// ─── Component ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { userId, username: cachedUsername, isLoading: isUserLoading, clearUser } = useUser();
  const { isEnabled: soundEnabled, setEnabled: setSoundEnabled } = useSound();

  // Username editing
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);

  // Notifications — local scheduler toggle
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Preferences
  const [selectedDomain, setSelectedDomain] = useState<DomainValue | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<UserGoalValue | null>(null);
  const [selectedDailyGoal, setSelectedDailyGoal] = useState<GoalValue>(50);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Load preferences from AsyncStorage
  useEffect(() => {
    (async () => {
      const [domain, goal, dailyGoal, adminMode] = await Promise.all([
        AsyncStorage.getItem('@mindy/preferred_domain'),
        AsyncStorage.getItem('@mindy/user_goal'),
        AsyncStorage.getItem('@mindy/daily_goal'),
        AsyncStorage.getItem('@mindy/admin_mode'),
      ]);
      if (domain) setSelectedDomain(domain as DomainValue);
      if (goal) setSelectedGoal(goal as UserGoalValue);
      if (dailyGoal) setSelectedDailyGoal(Number(dailyGoal) as GoalValue);
      if (adminMode === 'true') setIsAdminMode(true);
    })();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const validateUsername = (u: string) => {
    if (u.length < 3) return 'Minimum 3 caractères';
    if (u.length > 20) return 'Maximum 20 caractères';
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Lettres, chiffres et _ uniquement';
    return '';
  };

  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim();
    const err = validateUsername(trimmed);
    if (err) { setUsernameError(err); return; }

    setIsSavingUsername(true);
    setUsernameError('');
    try {
      const res = await usersApi.updateUsername(userId!, trimmed);
      if (res.success) {
        await AsyncStorage.setItem('@mindy/username', trimmed);
        setUsernameSaved(true);
        setNewUsername('');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setUsernameSaved(false), 2000);
      } else {
        setUsernameError((res as any).message || 'Username déjà pris');
      }
    } catch {
      setUsernameError('Erreur réseau — réessaie');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!userId) return;
    setIsSavingPrefs(true);
    try {
      // Update in AsyncStorage
      await Promise.all([
        selectedDomain
          ? AsyncStorage.setItem('@mindy/preferred_domain', selectedDomain)
          : AsyncStorage.removeItem('@mindy/preferred_domain'),
        selectedGoal
          ? AsyncStorage.setItem('@mindy/user_goal', selectedGoal)
          : AsyncStorage.removeItem('@mindy/user_goal'),
        AsyncStorage.setItem('@mindy/daily_goal', String(selectedDailyGoal)),
      ]);

      // Update in backend
      await usersApi.update(userId, {
        preferredDomain: selectedDomain,
        userGoal: selectedGoal,
      });

      setPrefsSaved(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch {
      // Non-blocking — local changes already saved
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleSoundToggle = async (val: boolean) => {
    await setSoundEnabled(val);
    if (userId) {
      try { await usersApi.updateSettings(userId, { soundEnabled: val }); } catch {}
    }
  };

  const handleDeleteAccount = () => {
    // First confirmation — warn user
    Alert.alert(
      '⚠️ Supprimer le compte',
      'Toute ta progression, tes XP et tes achievements seront perdus définitivement. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer →',
          style: 'destructive',
          onPress: () => {
            // Second confirmation — extra safety
            Alert.alert(
              '🚨 Dernière confirmation',
              'Confirmes-tu la suppression définitive de ton compte Mindly ?',
              [
                { text: 'Non, garder mon compte', style: 'cancel' },
                {
                  text: 'Oui, supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      if (userId) {
                        await usersApi.deleteAccount(userId);
                      }
                    } catch (_) {
                      // Proceed with local logout even if server call fails
                    } finally {
                      await clearUser();
                      router.replace('/login');
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    await clearUser();
    router.replace('/login');
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isUserLoading || !userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 20, gap: 16 }}>
          <SkeletonBox height={28} width="40%" borderRadius={8} />
          {[0, 1, 2].map(i => <SkeletonBox key={i} height={64} borderRadius={12} />)}
        </View>
      </SafeAreaView>
    );
  }

  const currentUsername = cachedUsername ?? '...';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Icon name="arrow-left" size={20} color="#8B949E" />
            </Pressable>
            <Text style={styles.headerTitle}>Paramètres</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* ── Section: Profil ─────────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(50)} style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Profil</Text>

            <View style={styles.currentUsername}>
              <Text style={styles.currentUsernameLabel}>Username actuel</Text>
              <Text style={styles.currentUsernameValue}>@{currentUsername}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Changer de username</Text>
              <View style={[
                styles.inputRow,
                newUsername.length >= 3 && !usernameError && styles.inputValid,
                usernameError ? styles.inputError : null,
              ]}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="nouveau_username"
                  placeholderTextColor="#484F58"
                  value={newUsername}
                  onChangeText={t => {
                    setNewUsername(t);
                    setUsernameError('');
                    setUsernameSaved(false);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
              </View>
              {usernameError ? (
                <Text style={styles.errorText}>{usernameError}</Text>
              ) : (
                <Text style={styles.hintText}>3–20 caractères, lettres/chiffres/_</Text>
              )}
              <Pressable
                style={[
                  styles.saveBtn,
                  (newUsername.length < 3 || isSavingUsername) && styles.saveBtnDisabled,
                ]}
                onPress={handleSaveUsername}
                disabled={newUsername.length < 3 || isSavingUsername}
              >
                <Text style={styles.saveBtnText}>
                  {isSavingUsername ? 'Saving...' : usernameSaved ? '✅ Saved!' : 'Sauvegarder'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Section: Apprentissage ──────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(80)} style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Apprentissage</Text>

            {/* Domain */}
            <View style={styles.prefGroup}>
              <Text style={styles.prefLabel}>Domaine préféré</Text>
              <View style={styles.chipRow}>
                {DOMAIN_OPTIONS.map(opt => {
                  const active = selectedDomain === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.chip,
                        active && { borderColor: opt.color, backgroundColor: opt.color + '18' },
                      ]}
                      onPress={() => {
                        setSelectedDomain(active ? null : opt.value);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.chipLabel, active && { color: opt.color }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* User goal */}
            <View style={[styles.prefGroup, { borderTopWidth: 1, borderTopColor: '#21262D' }]}>
              <Text style={styles.prefLabel}>Mon objectif</Text>
              <View style={styles.chipRow}>
                {USER_GOAL_OPTIONS.map(opt => {
                  const active = selectedGoal === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.chip,
                        active && { borderColor: '#58A6FF', backgroundColor: 'rgba(88,166,255,0.12)' },
                      ]}
                      onPress={() => {
                        setSelectedGoal(active ? null : opt.value);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.chipLabel, active && { color: '#58A6FF' }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Daily XP goal */}
            <View style={[styles.prefGroup, { borderTopWidth: 1, borderTopColor: '#21262D' }]}>
              <Text style={styles.prefLabel}>Objectif XP quotidien</Text>
              <View style={styles.chipRowGoal}>
                {GOAL_OPTIONS.map(opt => {
                  const active = selectedDailyGoal === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.goalChip,
                        active && { borderColor: opt.color, backgroundColor: opt.color + '18' },
                      ]}
                      onPress={() => {
                        setSelectedDailyGoal(opt.value);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[styles.goalChipLabel, active && { color: opt.color }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.goalChipSub, active && { color: opt.color + 'BB' }]}>
                        {opt.sub}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Save preferences button */}
            <View style={styles.prefSaveWrapper}>
              <Pressable
                style={[styles.saveBtn, isSavingPrefs && styles.saveBtnDisabled]}
                onPress={handleSavePreferences}
                disabled={isSavingPrefs}
              >
                <Text style={styles.saveBtnText}>
                  {isSavingPrefs ? 'Saving...' : prefsSaved ? '✅ Préférences sauvegardées !' : 'Sauvegarder les préférences'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Section: Audio ──────────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.section}>
            <Text style={styles.sectionTitle}>🔊 Audio</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Icon name="volume" size={18} color={soundEnabled ? '#39FF14' : '#8B949E'} />
                <View>
                  <Text style={styles.settingLabel}>Sons</Text>
                  <Text style={styles.settingDesc}>Effets sonores pendant les leçons</Text>
                </View>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={handleSoundToggle}
                trackColor={{ false: '#30363D', true: 'rgba(57,255,20,0.3)' }}
                thumbColor={soundEnabled ? '#39FF14' : '#8B949E'}
                ios_backgroundColor="#30363D"
              />
            </View>
          </Animated.View>

          {/* ── Section: Notifications ──────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(150)} style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 Notifications</Text>
            {/* Local scheduler toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Icon name="bell" size={18} color={notificationsEnabled ? '#58A6FF' : '#8B949E'} />
                <View>
                  <Text style={styles.settingLabel}>Notifications locales</Text>
                  <Text style={styles.settingDesc}>Rappels planifiés sur cet appareil</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={async v => {
                  setNotificationsEnabled(v);
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (v) {
                    const { scheduleStreakReminder, scheduleDailyChallengeReminder } =
                      await import('@/services/notifications');
                    await Promise.all([
                      scheduleStreakReminder(20, 0),
                      scheduleDailyChallengeReminder(9, 0),
                    ]);
                  } else {
                    const { cancelAllScheduledNotifications } =
                      await import('@/services/notifications');
                    await cancelAllScheduledNotifications();
                  }
                }}
                trackColor={{ false: '#30363D', true: 'rgba(88,166,255,0.3)' }}
                thumbColor={notificationsEnabled ? '#58A6FF' : '#8B949E'}
                ios_backgroundColor="#30363D"
              />
            </View>
            {/* Link to full notification preferences screen */}
            <Pressable
              style={[styles.linkRow, { borderTopWidth: 1, borderTopColor: '#21262D' }]}
              onPress={() => router.push('/notification-preferences' as any)}
            >
              <View style={styles.settingInfo}>
                <Icon name="settings" size={18} color="#39FF14" />
                <View>
                  <Text style={styles.settingLabel}>Préférences push</Text>
                  <Text style={styles.settingDesc}>Types, heure de rappel streak…</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={16} color="#484F58" />
            </Pressable>
          </Animated.View>

          {/* ── Section: App ────────────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Application</Text>
            <Pressable style={styles.linkRow} onPress={() => router.push('/leaderboard')}>
              <View style={styles.settingInfo}>
                <Icon name="trophy" size={18} color="#FFD700" />
                <Text style={styles.settingLabel}>Leaderboard</Text>
              </View>
              <Icon name="chevron-right" size={16} color="#484F58" />
            </Pressable>
            <Pressable style={[styles.linkRow, { borderTopWidth: 1, borderTopColor: '#21262D' }]} onPress={() => router.push('/achievements')}>
              <View style={styles.settingInfo}>
                <Icon name="star" size={18} color="#58A6FF" />
                <Text style={styles.settingLabel}>Achievements</Text>
              </View>
              <Icon name="chevron-right" size={16} color="#484F58" />
            </Pressable>
            {isAdminMode && (
              <Pressable
                style={[styles.linkRow, { borderTopWidth: 1, borderTopColor: '#21262D' }]}
                onPress={() => router.push('/admin' as any)}
              >
                <View style={styles.settingInfo}>
                  <Text style={{ fontSize: 18 }}>🛠</Text>
                  <Text style={[styles.settingLabel, { color: '#FF4444' }]}>Admin Dashboard</Text>
                </View>
                <Icon name="chevron-right" size={16} color="#484F58" />
              </Pressable>
            )}
          </Animated.View>

          {/* ── Section: Compte ─────────────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(250)} style={styles.section}>
            <Text style={styles.sectionTitle}>🔑 Compte</Text>
            <Pressable style={styles.logoutRow} onPress={handleLogout}>
              <Icon name="logout" size={18} color="#8B949E" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </Pressable>
            <Pressable style={[styles.logoutRow, { borderTopWidth: 1, borderTopColor: '#21262D' }]} onPress={handleDeleteAccount}>
              <Icon name="trash" size={18} color="#F85149" />
              <Text style={[styles.logoutText, { color: '#F85149' }]}>Supprimer mon compte</Text>
            </Pressable>
          </Animated.View>

          <Text style={styles.version}>MINDY v1.0.0 — Built with 🤖</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  scrollContent: { padding: 20, gap: 20, paddingBottom: 48 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  backBtn: { padding: 8, width: 36 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#E6EDF3', fontFamily: 'Inter' },

  section: {
    backgroundColor: '#161B22', borderRadius: 16,
    borderWidth: 1, borderColor: '#21262D', overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#8B949E',
    fontFamily: 'JetBrainsMono', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#21262D',
  },

  // Username
  currentUsername: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#21262D',
  },
  currentUsernameLabel: { fontSize: 13, color: '#8B949E', fontFamily: 'Inter' },
  currentUsernameValue: { fontSize: 15, fontWeight: '700', color: '#39FF14', fontFamily: 'JetBrainsMono' },
  inputGroup: { padding: 16, gap: 8 },
  inputLabel: { fontSize: 12, color: '#8B949E', fontFamily: 'Inter' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0D1117', borderRadius: 10, borderWidth: 2,
    borderColor: '#30363D', paddingHorizontal: 12, paddingVertical: 12,
  },
  inputValid: { borderColor: '#39FF14' },
  inputError: { borderColor: '#F85149' },
  atSign: { fontSize: 16, fontWeight: '700', color: '#39FF14', fontFamily: 'JetBrainsMono' },
  textInput: { flex: 1, fontSize: 15, color: '#E6EDF3', fontFamily: 'JetBrainsMono', padding: 0 },
  hintText: { fontSize: 11, color: '#484F58', fontFamily: 'Inter' },
  errorText: { fontSize: 12, color: '#F85149', fontFamily: 'Inter' },
  saveBtn: {
    backgroundColor: '#39FF14', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginTop: 4,
  },
  saveBtnDisabled: { backgroundColor: '#21262D' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#0D1117', fontFamily: 'Inter' },

  // Preferences
  prefGroup: { padding: 16, gap: 10 },
  prefLabel: { fontSize: 13, color: '#8B949E', fontFamily: 'Inter', fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#30363D', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#0D1117',
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, color: '#8B949E', fontFamily: 'Inter', fontWeight: '600' },
  chipRowGoal: { flexDirection: 'row', gap: 8 },
  goalChip: {
    flex: 1, alignItems: 'center', gap: 3,
    borderWidth: 1, borderColor: '#30363D', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 6,
    backgroundColor: '#0D1117',
  },
  goalChipLabel: { fontSize: 13, color: '#8B949E', fontFamily: 'JetBrainsMono', fontWeight: '700' },
  goalChipSub: { fontSize: 10, color: '#484F58', fontFamily: 'Inter' },
  prefSaveWrapper: { padding: 16, paddingTop: 4 },

  // Settings rows
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingLabel: { fontSize: 14, color: '#E6EDF3', fontFamily: 'Inter' },
  settingDesc: { fontSize: 11, color: '#484F58', fontFamily: 'Inter', marginTop: 2 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  logoutRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  logoutText: { fontSize: 14, color: '#8B949E', fontFamily: 'Inter' },
  version: { textAlign: 'center', fontSize: 11, color: '#30363D', fontFamily: 'JetBrainsMono' },
});
