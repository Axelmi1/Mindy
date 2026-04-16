import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Switch, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { UserProgressWithLesson, UserStats } from '@mindy/shared';
import { progressApi, usersApi, subscriptionsApi, leaderboardApi, type UserSubscription, type RecentActivityItem, type WeeklyXpHistoryEntry } from '@/api/client';
import { ActivityHeatmap } from '@/components/ui/ActivityHeatmap';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/hooks/useSound';
import { useAchievements, getRarityColor, getCategoryIcon } from '@/hooks/useAchievements';
import { useReferrals } from '@/hooks/useReferrals';
import { Icon, IconName } from '@/components/ui/Icon';
import { StreakFire, AchievementUnlockedModal } from '@/components/animations';
import { ReferralCard } from '@/components/ui/ReferralCard';
import { LeagueBadge } from '@/components/ui/LeagueBadge';
import { getLeague, xpToNextLeague } from '@/utils/league';
import { PaywallModal } from '@/components/ui/PaywallModal';
import { ExportProgressButton } from '@/components/ui/ExportProgressButton';

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
  const { userId, username: cachedUsername, isLoading: isUserLoading, clearUser } = useUser();
  const { isEnabled: soundEnabled, setEnabled: setSoundEnabled } = useSound();
  const { achievements, newlyUnlocked, clearNewlyUnlocked, refresh: refreshAchievements } = useAchievements(userId);
  const { stats: referralStats, shareReferralCode, isLoading: isReferralsLoading } = useReferrals(userId);
  const [userProgress, setUserProgress] = useState<UserProgressWithLesson[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activityData, setActivityData] = useState<{ date: string; count: number; xpEarned: number }[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [isActivityFeedLoading, setIsActivityFeedLoading] = useState(true);
  const [weeklyXpHistory, setWeeklyXpHistory] = useState<WeeklyXpHistoryEntry[]>([]);
  const [isWeeklyHistoryLoading, setIsWeeklyHistoryLoading] = useState(true);
  const [socialStats, setSocialStats] = useState<{
    challengesSent: number;
    challengesReceived: number;
    challengesWon: number;
    challengesLost: number;
    challengesDraw: number;
    winRate: number;
    avgRank4Weeks: number | null;
  } | null>(null);

  // Computed stats (fallback)
  const completedLessons = userStats?.lessonsCompleted ?? userProgress.filter(p => p.isCompleted).length;
  const totalXp = userStats?.xp ?? userProgress.reduce((acc, p) =>
    acc + (p.isCompleted ? p.lesson.xpReward : 0), 0
  );
  // Level formula: level = floor(sqrt(xp / 100)) + 1  (matches backend calculateLevel)
  const level = userStats?.level ?? (Math.floor(Math.sqrt(totalXp / 100)) + 1);
  const currentLevelXp = (level - 1) * (level - 1) * 100;
  const nextLevelXp = level * level * 100;
  const xpInCurrentLevel = Math.max(0, totalXp - currentLevelXp);
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  const levelProgress = xpNeededForLevel > 0 ? Math.min(xpInCurrentLevel / xpNeededForLevel, 1) : 1;
  const xpToNextLevel = Math.max(0, nextLevelXp - totalXp);

  // ── Share progression ──────────────────────────────────────────────────────
  const shareProgress = useCallback(async () => {
    const { getLeague } = require('@/utils/league');
    const league = getLeague(totalXp);
    const displayName = userStats?.username ?? cachedUsername ?? 'Moi';
    const streak = userStats?.streak ?? 0;

    // Build deep link: mindy://profile/<username>
    const deepLink = `mindy://profile/${encodeURIComponent(displayName)}`;

    const message = [
      `🎓 ${displayName} sur Mindly — app d'apprentissage Crypto & Finance`,
      ``,
      `📊 Ma progression :`,
      `  ⚡ ${totalXp.toLocaleString()} XP total`,
      `  🏆 Niveau ${level}`,
      `  🔥 ${streak} jour${streak > 1 ? 's' : ''} de streak`,
      `  ${league.emoji} Ligue ${league.name}`,
      `  📚 ${completedLessons} leçon${completedLessons > 1 ? 's' : ''} complétée${completedLessons > 1 ? 's' : ''}`,
      ``,
      `👉 Rejoins-moi sur Mindly : ${deepLink}`,
    ].join('\n');

    try {
      await Share.share({
        message,
        title: 'Ma progression Mindly',
        url: deepLink, // iOS shows URL separately (AirDrop, messages, etc.)
      });
    } catch (e) {
      // User cancelled or error — silent
    }
  }, [totalXp, level, completedLessons, userStats, cachedUsername]);

  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      const [progressRes, statsRes, activityRes, subRes, recentActivityRes, weeklyHistoryRes, socialStatsRes] = await Promise.all([
        progressApi.getByUser(userId),
        usersApi.getStats(userId),
        progressApi.getActivityHeatmap(userId, 56).catch(() => null),
        subscriptionsApi.getSubscription(userId).catch(() => null),
        usersApi.getRecentActivity(userId, 10).catch(() => null),
        leaderboardApi.getWeeklyHistory(userId, 8).catch(() => null),
        usersApi.getSocialStats(userId).catch(() => null),
      ]);

      if (progressRes.success && progressRes.data) {
        setUserProgress(progressRes.data);
      }

      if (statsRes.success && statsRes.data) {
        setUserStats(statsRes.data);
      }

      if (activityRes?.success && activityRes.data) {
        setActivityData(activityRes.data);
      }

      if (subRes?.data) {
        setSubscription(subRes.data);
      }

      if (recentActivityRes?.success && recentActivityRes.data) {
        setRecentActivity(recentActivityRes.data);
      }

      if (weeklyHistoryRes?.success && weeklyHistoryRes.data) {
        setWeeklyXpHistory(weeklyHistoryRes.data);
      }

      if (socialStatsRes?.success && socialStatsRes.data) {
        setSocialStats(socialStatsRes.data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
      setIsActivityLoading(false);
      setIsActivityFeedLoading(false);
      setIsWeeklyHistoryLoading(false);
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
          {(() => {
            const displayName = userStats?.username ?? cachedUsername ?? 'A';
            const initial = displayName.charAt(0).toUpperCase();
            return (
              <>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <Text style={styles.username}>{displayName}</Text>
              </>
            );
          })()}
          <View style={styles.badgesRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Level {level}</Text>
            </View>
            <LeagueBadge xp={totalXp} size="sm" />
            {subscription?.isPro && (
              <LinearGradient
                colors={['#7C3AED', '#5B21B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proBadge}
              >
                <Text style={styles.proBadgeText}>👑 PRO</Text>
              </LinearGradient>
            )}
            {userStats?.userRank != null && (
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>#{userStats.userRank} cette semaine</Text>
              </View>
            )}
          </View>

          {/* Pro / Upgrade CTA */}
          {!subscription?.isPro && (
            <Pressable
              style={styles.upgradeBtn}
              onPress={() => setShowPaywall(true)}
            >
              <LinearGradient
                colors={['#7C3AED', '#5B21B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeBtnGradient}
              >
                <Text style={styles.upgradeBtnText}>👑 Passer à Pro — illimité</Text>
              </LinearGradient>
            </Pressable>
          )}

          {/* Export PDF button (Pro) */}
          <View style={{ marginBottom: 10 }}>
            <ExportProgressButton
              isPro={subscription?.isPro ?? false}
              onUpgradePress={() => setShowPaywall(true)}
            />
          </View>

          {/* Share progression button */}
          <Pressable
            style={styles.shareBtn}
            onPress={shareProgress}
            accessibilityLabel="Partager ma progression"
          >
            <Icon name="share" size={14} color="#8B949E" />
            <Text style={styles.shareBtnText}>Partager ma progression</Text>
          </Pressable>
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
                <Text style={styles.streakValue}>{userStats?.streakFreezes ?? 0} / 3</Text>
              </View>
            </View>

            {/* Buy streak freeze */}
            {(userStats?.streakFreezes ?? 0) < 3 && (
              <Pressable
                style={styles.buyFreezeBtn}
                onPress={async () => {
                  if (!userId) return;
                  try {
                    const res = await usersApi.buyStreakFreeze(userId);
                    if (res.success && res.data) {
                      setUserStats(prev => prev ? {
                        ...prev,
                        xp: res.data!.xp,
                        streakFreezes: res.data!.streakFreezes,
                      } : prev);
                      Alert.alert('🛡️ Freeze acheté !', `Tu as dépensé ${res.data.xpSpent} XP pour un streak freeze.`);
                    } else {
                      Alert.alert('Erreur', 'Pas assez de XP ou maximum atteint.');
                    }
                  } catch {
                    Alert.alert('Erreur', 'Impossible d\'acheter un freeze.');
                  }
                }}
              >
                <Icon name="shield" size={14} color="#58A6FF" />
                <Text style={styles.buyFreezeBtnText}>Acheter un freeze (-50 XP)</Text>
              </Pressable>
            )}
          </GlassCard>
        </Animated.View>

        {/* Activity Heatmap */}
        <Animated.View entering={FadeInUp.delay(175)}>
          <ActivityHeatmap data={activityData} isLoading={isActivityLoading} />
        </Animated.View>

        {/* Weekly XP Chart */}
        {(weeklyXpHistory.length > 0 || isWeeklyHistoryLoading) && (
          <Animated.View entering={FadeInUp.delay(182)}>
            <GlassCard borderColor="#39FF14">
              <View style={styles.weeklyXpHeader}>
                <Text style={styles.weeklyXpTitle}>⚡ XP hebdomadaire</Text>
                <Text style={styles.weeklyXpSubtitle}>8 dernières semaines</Text>
              </View>
              {isWeeklyHistoryLoading ? (
                <View style={styles.weeklyXpSkeleton}>
                  {[...Array(8)].map((_, i) => (
                    <View key={i} style={[styles.weeklyXpSkeletonBar, { height: 20 + Math.random() * 40 }]} />
                  ))}
                </View>
              ) : (() => {
                const maxXp = Math.max(...weeklyXpHistory.map((w) => w.xpEarned), 1);
                const totalWeekXp = weeklyXpHistory.reduce((s, w) => s + w.xpEarned, 0);
                const bestWeek = weeklyXpHistory.reduce(
                  (best, w) => (w.xpEarned > best.xpEarned ? w : best),
                  weeklyXpHistory[0],
                );
                return (
                  <View style={styles.weeklyXpChartWrap}>
                    {/* Summary row */}
                    <View style={styles.weeklyXpSummary}>
                      <View style={styles.weeklyXpSummaryItem}>
                        <Text style={styles.weeklyXpSummaryValue}>{totalWeekXp.toLocaleString()}</Text>
                        <Text style={styles.weeklyXpSummaryLabel}>XP total</Text>
                      </View>
                      <View style={styles.weeklyXpSummaryDivider} />
                      <View style={styles.weeklyXpSummaryItem}>
                        <Text style={styles.weeklyXpSummaryValue}>{Math.round(totalWeekXp / 8).toLocaleString()}</Text>
                        <Text style={styles.weeklyXpSummaryLabel}>Moy./semaine</Text>
                      </View>
                      <View style={styles.weeklyXpSummaryDivider} />
                      <View style={styles.weeklyXpSummaryItem}>
                        <Text style={[styles.weeklyXpSummaryValue, { color: '#39FF14' }]}>
                          {bestWeek?.xpEarned.toLocaleString() ?? 0}
                        </Text>
                        <Text style={styles.weeklyXpSummaryLabel}>Meilleure sem.</Text>
                      </View>
                    </View>
                    {/* Bars */}
                    <View style={styles.weeklyXpBars}>
                      {weeklyXpHistory.map((week, i) => {
                        const pct = week.xpEarned / maxXp;
                        const isCurrentWeek = i === weeklyXpHistory.length - 1;
                        const barColor = isCurrentWeek ? '#39FF14' : 'rgba(57,255,20,0.4)';
                        return (
                          <View key={i} style={styles.weeklyXpBarGroup}>
                            <View style={styles.weeklyXpBarTrack}>
                              {/* Value label on top for non-zero */}
                              {week.xpEarned > 0 && (
                                <Text style={styles.weeklyXpBarValue} numberOfLines={1}>
                                  {week.xpEarned}
                                </Text>
                              )}
                              <View
                                style={[
                                  styles.weeklyXpBarFill,
                                  {
                                    height: `${Math.max(4, Math.round(pct * 100))}%` as any,
                                    backgroundColor: barColor,
                                    shadowColor: barColor,
                                    shadowOpacity: isCurrentWeek ? 0.8 : 0.3,
                                    shadowRadius: isCurrentWeek ? 6 : 2,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.weeklyXpBarLabel} numberOfLines={1}>
                              {week.label.replace(' ', '\n')}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                    <Text style={styles.weeklyXpCurrentNote}>
                      🟢 = Semaine actuelle
                    </Text>
                  </View>
                );
              })()}
            </GlassCard>
          </Animated.View>
        )}

        {/* ── Communauté ─────────────────────────────────────────── */}
        {socialStats && (
          <Animated.View entering={FadeInUp.delay(188)}>
            <GlassCard borderColor="rgba(88,166,255,0.35)">
              <Text style={styles.socialTitle}>🤝 Communauté</Text>

              {/* Win rate banner */}
              <View style={styles.socialWinRow}>
                <View style={styles.socialWinBox}>
                  <Text style={styles.socialWinPct}>{socialStats.winRate}%</Text>
                  <Text style={styles.socialWinLabel}>Taux de victoire</Text>
                </View>
                {socialStats.avgRank4Weeks != null && (
                  <View style={styles.socialRankBox}>
                    <Text style={styles.socialRankValue}>#{socialStats.avgRank4Weeks}</Text>
                    <Text style={styles.socialRankLabel}>Rang moyen 4 sem.</Text>
                  </View>
                )}
              </View>

              {/* Challenge stats grid */}
              <View style={styles.socialGrid}>
                {[
                  { label: 'Défis envoyés',  value: socialStats.challengesSent,      color: '#39FF14' },
                  { label: 'Défis reçus',    value: socialStats.challengesReceived,   color: '#58A6FF' },
                  { label: 'Victoires',      value: socialStats.challengesWon,        color: '#39FF14' },
                  { label: 'Défaites',       value: socialStats.challengesLost,       color: '#F85149' },
                  { label: 'Nuls',           value: socialStats.challengesDraw,       color: '#8B949E' },
                  { label: 'Terminés',       value: socialStats.challengesWon + socialStats.challengesLost + socialStats.challengesDraw, color: '#FFD700' },
                ].map(({ label, value, color }) => (
                  <View key={label} style={styles.socialStatCell}>
                    <Text style={[styles.socialStatVal, { color }]}>{value}</Text>
                    <Text style={styles.socialStatLbl}>{label}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Recent Activity Timeline */}
        {(recentActivity.length > 0 || isActivityFeedLoading) && (
          <Animated.View entering={FadeInUp.delay(185)}>
            <GlassCard borderColor="#58A6FF">
              <View style={styles.activityFeedHeader}>
                <Text style={styles.activityFeedTitle}>Activité récente</Text>
                <Text style={styles.activityFeedCount}>
                  {isActivityFeedLoading ? '...' : `${recentActivity.length} événements`}
                </Text>
              </View>
              {isActivityFeedLoading ? (
                <View style={styles.activityFeedList}>
                  {[0, 1, 2].map(i => (
                    <View key={i} style={styles.activityFeedSkeletonRow}>
                      <View style={styles.activityFeedSkeletonIcon} />
                      <View style={{ flex: 1, gap: 5 }}>
                        <View style={[styles.activityFeedSkeletonText, { width: '70%' }]} />
                        <View style={[styles.activityFeedSkeletonText, { width: '40%', opacity: 0.5 }]} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.activityFeedList}>
                  {recentActivity.map((item, idx) => {
                    const date = new Date(item.timestamp);
                    const isToday = new Date().toDateString() === date.toDateString();
                    const timeStr = isToday
                      ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                      : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                    return (
                      <View key={item.id} style={[styles.activityFeedRow, idx > 0 && styles.activityFeedRowBorder]}>
                        <View style={styles.activityFeedIconWrap}>
                          <Text style={styles.activityFeedIcon}>{item.icon}</Text>
                        </View>
                        <View style={styles.activityFeedContent}>
                          <Text style={styles.activityFeedLabel} numberOfLines={1}>
                            {item.label}
                          </Text>
                          <Text style={styles.activityFeedTime}>{timeStr}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {/* XP Progress */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <GlassCard borderColor="#39FF14">
            <View style={styles.xpHeader}>
              <Text style={styles.xpTitle}>Level Progress</Text>
              <Text style={styles.xpRemaining}>{xpToNextLevel.toLocaleString()} XP to Level {level + 1}</Text>
            </View>
            <View style={styles.xpBar}>
              <LinearGradient
                colors={['#39FF14', '#58A6FF'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.xpFill, { width: `${(levelProgress * 100).toFixed(1)}%` as any }]}
              />
            </View>
            <View style={styles.xpBarLabels}>
              <Text style={styles.xpBarLabel}>{currentLevelXp.toLocaleString()} XP</Text>
              <Text style={styles.xpBarLabel}>{nextLevelXp.toLocaleString()} XP</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Domain Progress Breakdown */}
        {userStats?.domainStats && userStats.domainStats.length > 0 && (
          <Animated.View entering={FadeInUp.delay(250)}>
            <GlassCard borderColor="#58A6FF">
              <Text style={styles.domainTitle}>Progression par domaine</Text>
              <View style={styles.domainList}>
                {userStats.domainStats.map((ds) => {
                  const pct = ds.total > 0 ? Math.min((ds.completed / ds.total) * 100, 100) : 0;
                  const color =
                    ds.domain === 'CRYPTO'
                      ? '#F7931A'
                      : ds.domain === 'FINANCE'
                      ? '#39FF14'
                      : '#58A6FF';
                  return (
                    <View key={ds.domain} style={styles.domainRow}>
                      <View style={styles.domainRowHeader}>
                        <Text style={styles.domainEmoji}>{ds.emoji}</Text>
                        <Text style={styles.domainLabel}>{ds.label}</Text>
                        <Text style={[styles.domainCount, { color }]}>
                          {ds.completed}/{ds.total}
                        </Text>
                      </View>
                      <View style={styles.domainBar}>
                        <View
                          style={[
                            styles.domainBarFill,
                            {
                              width: `${Math.round(pct)}%` as any,
                              backgroundColor: color,
                              shadowColor: color,
                              shadowOpacity: 0.6,
                              shadowRadius: 4,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.domainPct}>{Math.round(pct)}%</Text>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Hall of Legends — LEGENDARY achievements only */}
        {achievements && achievements.unlocked.some(ua => ua.achievement.rarity === 'LEGENDARY') && (
          <Animated.View entering={FadeInUp.delay(280)}>
            <LinearGradient
              colors={['rgba(255,215,0,0.12)', 'rgba(255,165,0,0.06)', 'rgba(255,215,0,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={legendaryStyles.container}
            >
              {/* Golden border glow */}
              <LinearGradient
                colors={['#FFD700', '#FF8C00', '#FFD700']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={legendaryStyles.borderTop}
              />
              <View style={legendaryStyles.header}>
                <Text style={legendaryStyles.crownEmoji}>👑</Text>
                <View>
                  <Text style={legendaryStyles.title}>Hall of Legends</Text>
                  <Text style={legendaryStyles.subtitle}>
                    {achievements.unlocked.filter(ua => ua.achievement.rarity === 'LEGENDARY').length} badge{achievements.unlocked.filter(ua => ua.achievement.rarity === 'LEGENDARY').length > 1 ? 's' : ''} légendaire{achievements.unlocked.filter(ua => ua.achievement.rarity === 'LEGENDARY').length > 1 ? 's' : ''} obtenus
                  </Text>
                </View>
              </View>

              <View style={legendaryStyles.badgeRow}>
                {achievements.unlocked
                  .filter(ua => ua.achievement.rarity === 'LEGENDARY')
                  .map((ua) => {
                    const iconName = getCategoryIcon(ua.achievement.category) as IconName;
                    return (
                      <Animated.View
                        key={ua.id}
                        entering={ZoomIn.delay(100).duration(400)}
                        style={legendaryStyles.badgeCard}
                      >
                        <LinearGradient
                          colors={['rgba(255,215,0,0.25)', 'rgba(255,140,0,0.15)']}
                          style={legendaryStyles.badgeGradient}
                        >
                          <View style={legendaryStyles.badgeIconRing}>
                            <Icon name={iconName} size={32} color="#FFD700" />
                          </View>
                          <Text style={legendaryStyles.badgeName} numberOfLines={2}>
                            {ua.achievement.name}
                          </Text>
                          <View style={legendaryStyles.xpPill}>
                            <Text style={legendaryStyles.xpPillText}>+{ua.achievement.xpReward} XP</Text>
                          </View>
                          <View style={legendaryStyles.rarityBadge}>
                            <Text style={legendaryStyles.rarityBadgeText}>✨ LEGENDARY</Text>
                          </View>
                        </LinearGradient>
                      </Animated.View>
                    );
                  })}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Achievements Preview */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Pressable onPress={() => router.push('/achievements')}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          <View style={styles.achievementsGrid}>
            {/* Show first 4 non-legendary unlocked achievements */}
            {achievements?.unlocked
              .filter(ua => ua.achievement.rarity !== 'LEGENDARY')
              .slice(0, 4)
              .map((ua) => {
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
            {achievements?.locked.slice(0, Math.max(0, 4 - (achievements?.unlocked.filter(ua => ua.achievement.rarity !== 'LEGENDARY').length || 0))).map((a) => (
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

          <GlassCard borderColor="#39FF14">
            <Pressable style={styles.settingItemInner} onPress={() => router.push('/settings' as any)}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconBg, { backgroundColor: 'rgba(57,255,20,0.1)' }]}>
                  <Icon name="settings" size={18} color="#39FF14" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Paramètres</Text>
                  <Text style={[styles.settingLabel, { fontSize: 11, color: '#484F58', marginTop: 1 }]}>
                    Username, son, notifications
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color="#39FF14" />
            </Pressable>
          </GlassCard>

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

      {/* Paywall Modal */}
      {userId && (
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          userId={userId}
          onSubscribed={async () => {
            const subRes = await subscriptionsApi.getSubscription(userId).catch(() => null);
            if (subRes?.data) setSubscription(subRes.data);
          }}
        />
      )}
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
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
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
  rankBadge: {
    backgroundColor: 'rgba(88, 166, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 166, 255, 0.4)',
  },
  rankBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#58A6FF',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(139,148,158,0.1)',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  shareBtnText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
    letterSpacing: 0.3,
  },
  buyFreezeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(88,166,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(88,166,255,0.3)',
    borderRadius: 10,
    paddingVertical: 8,
  },
  buyFreezeBtnText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#58A6FF',
  },
  // Domain breakdown
  domainTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
    marginBottom: 14,
  },
  domainList: {
    gap: 14,
  },
  domainRow: {
    gap: 6,
  },
  domainRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  domainEmoji: {
    fontSize: 16,
  },
  domainLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#E6EDF3',
    flex: 1,
  },
  domainCount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
  },
  domainBar: {
    height: 6,
    backgroundColor: '#30363D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  domainBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  domainPct: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#6E7681',
    alignSelf: 'flex-end',
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
  // ── Recent Activity Feed ──────────────────────────────────────────────────
  // ── Weekly XP Chart ────────────────────────────────────────────────────────
  weeklyXpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  weeklyXpTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  weeklyXpSubtitle: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
  },
  weeklyXpSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 6,
  },
  weeklyXpSkeletonBar: {
    flex: 1,
    backgroundColor: '#21262D',
    borderRadius: 4,
  },
  weeklyXpChartWrap: {
    gap: 12,
  },
  weeklyXpSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262D',
    borderRadius: 10,
    padding: 12,
    gap: 0,
  },
  weeklyXpSummaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  weeklyXpSummaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#30363D',
  },
  weeklyXpSummaryValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 15,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  weeklyXpSummaryLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#8B949E',
  },
  weeklyXpBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
    gap: 4,
  },
  weeklyXpBarGroup: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    gap: 4,
  },
  weeklyXpBarTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  weeklyXpBarValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    color: '#39FF14',
    marginBottom: 2,
  },
  weeklyXpBarFill: {
    width: '100%',
    borderRadius: 3,
    minHeight: 4,
  },
  weeklyXpBarLabel: {
    fontFamily: 'Inter',
    fontSize: 8,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 10,
  },
  weeklyXpCurrentNote: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#8B949E',
    textAlign: 'right',
    marginTop: -4,
  },
  // ── Activity Feed ─────────────────────────────────────────────────────────
  activityFeedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activityFeedTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  activityFeedCount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
  },
  activityFeedList: {
    gap: 0,
  },
  activityFeedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  activityFeedRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  activityFeedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(88,166,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  activityFeedIcon: {
    fontSize: 18,
  },
  activityFeedContent: {
    flex: 1,
    gap: 3,
  },
  activityFeedLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#C9D1D9',
  },
  activityFeedTime: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#6E7681',
  },
  activityFeedSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  activityFeedSkeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  activityFeedSkeletonText: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
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
  xpBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xpBarLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#484F58',
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
  // Pro badge
  proBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Upgrade CTA
  upgradeBtn: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'stretch',
    marginHorizontal: 0,
  },
  upgradeBtnGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 12,
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  // ── Social / Communauté ───────────────────────────────────────────────────
  socialTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 12,
  },
  socialWinRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  socialWinBox: {
    flex: 1,
    backgroundColor: 'rgba(57,255,20,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.2)',
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  socialWinPct: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '800',
    color: '#39FF14',
  },
  socialWinLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#6E7681',
    marginTop: 2,
  },
  socialRankBox: {
    flex: 1,
    backgroundColor: 'rgba(88,166,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(88,166,255,0.2)',
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  socialRankValue: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '800',
    color: '#58A6FF',
  },
  socialRankLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#6E7681',
    marginTop: 2,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialStatCell: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  socialStatVal: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '800',
  },
  socialStatLbl: {
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    color: '#6E7681',
    marginTop: 2,
    textAlign: 'center' as const,
  },
});

// ─── Legendary Hall of Fame styles ───────────────────────────────────────────
const legendaryStyles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.4)',
    padding: 16,
    gap: 14,
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  crownEmoji: {
    fontSize: 32,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(255,215,0,0.7)',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    flex: 1,
    minWidth: 130,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.5)',
    shadowColor: '#FFD700',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  badgeIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeName: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    lineHeight: 18,
  },
  xpPill: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  xpPillText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
  },
  rarityBadge: {
    backgroundColor: 'rgba(255,140,0,0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rarityBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#FF8C00',
    letterSpacing: 0.5,
  },
});
