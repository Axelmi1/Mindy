import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { UserProgressWithLesson, UserStats } from '@mindy/shared';
import { progressApi, usersApi } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/hooks/useSound';
import { useAchievements, getRarityColor, getCategoryIcon } from '@/hooks/useAchievements';
import { useReferrals } from '@/hooks/useReferrals';
import { Icon, IconName } from '@/components/ui/Icon';
import { StreakFire, AchievementUnlockedModal } from '@/components/animations';
import { ReferralCard } from '@/components/ui/ReferralCard';

// Glass Card Component
function GlassCard({ children, style, borderColor }: {
  children: React.ReactNode;
  style?: any;
  borderColor?: string;
}) {
  return (
    <View style={[glassStyles.container, style]}>
      {borderColor && (
        <LinearGradient
          colors={[borderColor + '60', borderColor + '10', borderColor + '40'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={glassStyles.gradientBorder}
        />
      )}
      <View style={glassStyles.inner}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, glassStyles.androidBg]} />
        )}
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.05)'] as const}
          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        />
        <View style={glassStyles.content}>{children}</View>
      </View>
    </View>
  );
}

const glassStyles = StyleSheet.create({
  container: { borderRadius: 18, overflow: 'hidden' },
  gradientBorder: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 19 },
  inner: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  androidBg: { backgroundColor: 'rgba(22, 27, 34, 0.85)' },
  content: { padding: 16 },
});

/**
 * Profile Screen - User stats and settings
 */
export default function ProfileScreen() {
  const { userId, isLoading: isUserLoading, clearUser } = useUser();
  const { isEnabled: soundEnabled, setEnabled: setSoundEnabled } = useSound();
  const { achievements, newlyUnlocked, clearNewlyUnlocked, refresh: refreshAchievements } = useAchievements(userId);
  const { stats: referralStats, shareReferralCode, isLoading: isReferralsLoading } = useReferrals(userId);
  const [userProgress, setUserProgress] = useState<UserProgressWithLesson[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Computed stats (fallback)
  const completedLessons = userStats?.lessonsCompleted ?? userProgress.filter(p => p.isCompleted).length;
  const totalXp = userStats?.xp ?? userProgress.reduce((acc, p) =>
    acc + (p.isCompleted ? p.lesson.xpReward : 0), 0
  );
  const level = userStats?.level ?? Math.floor(totalXp / 200) + 1;
  const xpToNextLevel = 200 - (totalXp % 200);

  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      const [progressRes, statsRes] = await Promise.all([
        progressApi.getByUser(userId),
        usersApi.getStats(userId),
      ]);

      if (progressRes.success && progressRes.data) {
        setUserProgress(progressRes.data);
      }

      if (statsRes.success && statsRes.data) {
        setUserStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      refreshAchievements();
    }, [loadData, refreshAchievements])
  );

  // Handle sound toggle
  const handleSoundToggle = async (value: boolean) => {
    await setSoundEnabled(value);
    // Also update on server
    if (userId) {
      try {
        await usersApi.updateSettings(userId, { soundEnabled: value });
      } catch (err) {
        console.error('Error saving sound setting:', err);
      }
    }
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'This will clear all your progress. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearUser();
            setUserProgress([]);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearUser();
            router.replace('/login');
          },
        },
      ]
    );
  };

  // Redirect to login if no user (must be before any returns)
  useEffect(() => {
    if (!isUserLoading && !userId) {
      router.replace('/login');
    }
  }, [isUserLoading, userId]);

  if (isUserLoading || !userId || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#39FF14" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <Text style={styles.username}>anon</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {level}</Text>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.statsGrid}>
          <GlassCard style={styles.statCardGlass} borderColor="#FFD700">
            <View style={styles.statCardInner}>
              <Icon name="zap" size={20} color="#FFD700" />
              <Text style={styles.statValue}>{totalXp.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
          </GlassCard>
          <GlassCard style={styles.statCardGlass} borderColor="#39FF14">
            <View style={styles.statCardInner}>
              <Icon name="book" size={20} color="#39FF14" />
              <Text style={styles.statValue}>{completedLessons}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
          </GlassCard>
          <GlassCard style={styles.statCardGlass} borderColor="#FF6B35">
            <View style={styles.statCardInner}>
              <StreakFire streak={userStats?.streak ?? 0} size="small" showCount={false} />
              <Text style={styles.statValue}>{userStats?.streak ?? 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Streak Info */}
        <Animated.View entering={FadeInUp.delay(150)}>
          <GlassCard borderColor="#58A6FF">
            <View style={styles.streakRow}>
              <View style={styles.streakItem}>
                <Icon name="trophy" size={18} color="#FFD700" />
                <Text style={styles.streakLabel}>Best Streak</Text>
                <Text style={styles.streakValue}>{userStats?.maxStreak ?? 0} days</Text>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.streakItem}>
                <Icon name="shield" size={18} color="#58A6FF" />
                <Text style={styles.streakLabel}>Streak Freezes</Text>
                <Text style={styles.streakValue}>{userStats?.streakFreezes ?? 0} left</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* XP Progress */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <GlassCard borderColor="#39FF14">
            <View style={styles.xpHeader}>
              <Text style={styles.xpTitle}>Level Progress</Text>
              <Text style={styles.xpRemaining}>{xpToNextLevel} XP to Level {level + 1}</Text>
            </View>
            <View style={styles.xpBar}>
              <LinearGradient
                colors={['#39FF14', '#58A6FF'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.xpFill, { width: `${((200 - xpToNextLevel) / 200) * 100}%` }]}
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Achievements Preview */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Pressable onPress={() => router.push('/achievements')}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          <View style={styles.achievementsGrid}>
            {/* Show first 4 unlocked achievements, or locked placeholders */}
            {achievements?.unlocked.slice(0, 4).map((ua) => {
              const rarityColor = getRarityColor(ua.achievement.rarity);
              const iconName = getCategoryIcon(ua.achievement.category) as IconName;
              return (
                <GlassCard key={ua.id} style={styles.achievementGlass} borderColor={rarityColor}>
                  <View style={styles.achievementInner}>
                    <Icon name={iconName} size={28} color={rarityColor} />
                    <Text style={styles.achievementLabel}>{ua.achievement.name}</Text>
                  </View>
                </GlassCard>
              );
            })}
            {/* Fill remaining slots with locked achievements */}
            {achievements?.locked.slice(0, Math.max(0, 4 - (achievements?.unlocked.length || 0))).map((a) => (
              <GlassCard key={a.id} style={[styles.achievementGlass, styles.achievementLocked]}>
                <View style={styles.achievementInner}>
                  <Icon name={getCategoryIcon(a.category) as IconName} size={28} color="#484F58" />
                  <Text style={[styles.achievementLabel, { color: '#484F58' }]}>{a.name}</Text>
                </View>
              </GlassCard>
            ))}
            {/* Fallback if no achievements loaded */}
            {!achievements && (
              <>
                <GlassCard style={[styles.achievementGlass, styles.achievementLocked]}>
                  <View style={styles.achievementInner}>
                    <Icon name="target" size={28} color="#484F58" />
                    <Text style={[styles.achievementLabel, { color: '#484F58' }]}>First Step</Text>
                  </View>
                </GlassCard>
                <GlassCard style={[styles.achievementGlass, styles.achievementLocked]}>
                  <View style={styles.achievementInner}>
                    <Icon name="flame" size={28} color="#484F58" />
                    <Text style={[styles.achievementLabel, { color: '#484F58' }]}>7 Day Streak</Text>
                  </View>
                </GlassCard>
              </>
            )}
          </View>
        </Animated.View>

        {/* Referral Section */}
        <Animated.View entering={FadeInUp.delay(350)}>
          <ReferralCard
            stats={referralStats}
            onShare={shareReferralCode}
            isLoading={isReferralsLoading}
          />
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <GlassCard borderColor={soundEnabled ? '#39FF14' : undefined}>
            <Pressable style={styles.settingItemInner}>
              <View style={styles.settingInfo}>
                <View style={styles.settingIconBg}>
                  <Icon name="volume" size={18} color={soundEnabled ? '#39FF14' : '#8B949E'} />
                </View>
                <Text style={styles.settingLabel}>Sound Effects</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={handleSoundToggle}
                trackColor={{ false: '#30363D', true: 'rgba(57, 255, 20, 0.3)' }}
                thumbColor={soundEnabled ? '#39FF14' : '#8B949E'}
                ios_backgroundColor="#30363D"
              />
            </Pressable>
          </GlassCard>

          <GlassCard borderColor="#FFD700">
            <Pressable style={styles.settingItemInner} onPress={() => router.push('/leaderboard')}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconBg, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
                  <Icon name="trophy" size={18} color="#FFD700" />
                </View>
                <Text style={styles.settingLabel}>Leaderboard</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#FFD700" />
            </Pressable>
          </GlassCard>

          <GlassCard borderColor="#F85149">
            <Pressable style={styles.settingItemInner} onPress={handleResetProgress}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconBg, { backgroundColor: 'rgba(248, 81, 73, 0.1)' }]}>
                  <Icon name="alert" size={18} color="#F85149" />
                </View>
                <Text style={[styles.settingLabel, { color: '#F85149' }]}>Reset Progress</Text>
              </View>
            </Pressable>
          </GlassCard>

          <GlassCard>
            <Pressable style={styles.settingItemInner} onPress={handleLogout}>
              <View style={styles.settingInfo}>
                <View style={styles.settingIconBg}>
                  <Icon name="logout" size={18} color="#8B949E" />
                </View>
                <Text style={styles.settingLabel}>Logout</Text>
              </View>
            </Pressable>
          </GlassCard>
        </Animated.View>

        {/* Version */}
        <Text style={styles.version}>MINDY v1.0.0</Text>
      </ScrollView>

      {/* Achievement Unlocked Celebration */}
      <AchievementUnlockedModal
        visible={!!newlyUnlocked}
        achievement={newlyUnlocked?.achievement ?? null}
        onDismiss={clearNewlyUnlocked}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 24,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#39FF14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '700',
    color: '#0D1117',
  },
  username: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  levelBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#39FF14',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardGlass: {
    flex: 1,
  },
  statCardInner: {
    alignItems: 'center',
    gap: 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  statValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 22,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  statLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#8B949E',
    marginTop: 2,
  },
  xpSection: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  xpTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  xpRemaining: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
  },
  xpBar: {
    height: 8,
    backgroundColor: '#30363D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#39FF14',
    borderRadius: 4,
  },
  achievementsSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  viewAllText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#58A6FF',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementGlass: {
    width: '47%',
  },
  achievementInner: {
    alignItems: 'center',
    gap: 8,
  },
  achievement: {
    width: '47%',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#39FF14',
  },
  achievementLocked: {
    opacity: 0.4,
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#E6EDF3',
    textAlign: 'center',
  },
  streakInfo: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#30363D',
  },
  streakLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#8B949E',
    marginTop: 4,
  },
  streakValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  settingsSection: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  settingItemInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 148, 158, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#E6EDF3',
  },
  resetButton: {
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F85149',
    marginTop: 8,
  },
  resetButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#F85149',
  },
  logoutButton: {
    backgroundColor: '#30363D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#8B949E',
  },
  version: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#484F58',
    textAlign: 'center',
    marginTop: 16,
  },
});
