import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import type { Lesson, UserProgressWithLesson, UserStats } from '@mindy/shared';
import { lessonsApi, progressApi, usersApi, dailyChallengeApi, challengesApi, DailyChallenge, LessonChallenge } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { useAchievements } from '@/hooks/useAchievements';
import { useDailyGoal } from '@/hooks/useDailyGoal';
import { usePushToken } from '@/hooks/usePushToken';
import { StreakFire, AchievementUnlockedModal } from '@/components/animations';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { StreakCalendar } from '@/components/ui/StreakCalendar';
import { DailyGoalCard } from '@/components/ui/DailyGoalCard';
import { LeagueBadge } from '@/components/ui/LeagueBadge';
import { GoalCelebrationModal } from '@/components/ui/GoalCelebrationModal';

interface CurrentLesson {
  id: string;
  title: string;
  progress: number;
  domain: 'CRYPTO' | 'FINANCE' | 'TRADING';
  totalSteps: number;
  completedSteps: number;
}

/**
 * Home Screen - Polished Dashboard
 */
export default function HomeScreen() {
  const { userId, username: cachedUsername, isLoading: isUserLoading } = useUser();
  const { newlyUnlocked, clearNewlyUnlocked, refresh: refreshAchievements } = useAchievements(userId);

  // Register Expo push token with backend (once per session, non-blocking)
  usePushToken(userId ?? null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<CurrentLesson | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgressWithLesson[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [pendingChallenges, setPendingChallenges] = useState<LessonChallenge[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // ⚠️ Must be here (top-level) — before any early returns (Rules of Hooks)
  const dailyGoal = useDailyGoal(userStats?.xp ?? 0);

  const completedCount = userProgress.filter(p => p.isCompleted).length;

  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      const [lessonsRes, progressRes, statsRes, challengeRes, challengesRes] = await Promise.all([
        lessonsApi.getAll(),
        progressApi.getByUser(userId).catch(() => ({ success: true, data: [] })),
        usersApi.getStats(userId).catch(() => null),
        dailyChallengeApi.getToday(userId).catch(() => null),
        challengesApi.getForUser(userId).catch(() => null),
      ]);

      if (lessonsRes.success && lessonsRes.data) {
        setLessons(lessonsRes.data);
        const progressData = progressRes.success ? progressRes.data || [] : [];
        setUserProgress(progressData);

        if (statsRes?.success && statsRes.data) {
          setUserStats(statsRes.data);
        }

        if (challengeRes?.success && challengeRes.data) {
          setDailyChallenge(challengeRes.data);
        }

        // Pending lesson challenges (received by this user)
        if (challengesRes?.success && challengesRes.data) {
          const pending = challengesRes.data.received.filter(c => c.status === 'PENDING');
          setPendingChallenges(pending);
        }

        let lessonToContinue = lessonsRes.data.find(lesson => {
          const progress = progressData.find(p => p.lessonId === lesson.id);
          return !progress?.isCompleted;
        });

        if (!lessonToContinue) {
          lessonToContinue = lessonsRes.data[0];
        }

        if (lessonToContinue) {
          const progress = progressData.find(p => p.lessonId === lessonToContinue!.id);
          const completedSteps = progress?.completedSteps.length || 0;
          const totalSteps = lessonToContinue.content.steps.length;

          setCurrentLesson({
            id: lessonToContinue.id,
            title: lessonToContinue.title,
            domain: lessonToContinue.domain,
            totalSteps,
            completedSteps,
            progress: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
          });
        }
      }
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      refreshAchievements();
    }, [loadData, refreshAchievements])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const handleRespondChallenge = useCallback(async (
    challengeId: string,
    status: 'ACCEPTED' | 'DECLINED',
  ) => {
    if (!userId) return;
    setRespondingId(challengeId);
    try {
      const res = await challengesApi.respond(challengeId, userId, status);
      if (res.success) {
        // Remove from local pending list immediately for snappy UI
        setPendingChallenges(prev => prev.filter(c => c.id !== challengeId));
        if (status === 'ACCEPTED') {
          Alert.alert('⚔️ Défi accepté !', 'Va dans Défis pour jouer votre duel.');
        }
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de répondre au défi.');
    } finally {
      setRespondingId(null);
    }
  }, [userId]);

  // Redirect to login if no user (must be before any returns)
  useEffect(() => {
    if (!isUserLoading && !userId) {
      router.replace('/login');
    }
  }, [isUserLoading, userId]);

  if (isUserLoading || isLoading || !userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scrollContent}>
          {/* Header skeleton */}
          <View style={[styles.header, { marginBottom: 24 }]}>
            <View style={{ gap: 8 }}>
              <SkeletonBox width={80} height={14} borderRadius={6} />
              <SkeletonBox width={140} height={28} borderRadius={8} />
            </View>
            <SkeletonBox width={60} height={32} borderRadius={16} />
          </View>
          {/* Stats skeleton */}
          <View style={[styles.statsGrid, { marginBottom: 20 }]}>
            <SkeletonBox height={88} borderRadius={16} style={{ flex: 1 }} />
            <SkeletonBox height={88} borderRadius={16} style={{ flex: 1 }} />
            <SkeletonBox height={88} borderRadius={16} style={{ flex: 1 }} />
          </View>
          {/* Daily card skeleton */}
          <SkeletonBox height={96} borderRadius={16} style={{ marginBottom: 20 }} />
          {/* Continue card skeleton */}
          <SkeletonBox height={140} borderRadius={16} style={{ marginBottom: 20 }} />
          {/* Progress section skeleton */}
          <View style={{ gap: 12, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <SkeletonBox width={120} height={18} borderRadius={6} />
              <SkeletonBox width={40} height={18} borderRadius={6} />
            </View>
            <SkeletonBox height={8} borderRadius={4} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const totalLessons = userStats?.totalLessons ?? lessons.length;
  const lessonsCompleted = userStats?.lessonsCompleted ?? completedCount;
  const progressPercent = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;

  // Level XP progress calculation: level = floor(sqrt(xp/100)) + 1
  const currentXp = userStats?.xp ?? 0;

  const showCelebration = dailyGoal.shouldCelebrate;
  const currentLevel = userStats?.level ?? 1;
  const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
  const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
  const xpProgress = xpForNextLevel > xpForCurrentLevel
    ? ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
    : 100;
  const xpToNext = Math.max(0, xpForNextLevel - currentXp);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#39FF14"
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.username}>{userStats?.username ?? cachedUsername ?? '...'}</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={{ gap: 6, alignItems: 'flex-end' }}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lvl {userStats?.level ?? 1}</Text>
            </View>
            <LeagueBadge xp={currentXp} size="sm" />
          </Pressable>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsGrid}>
          {/* XP Card */}
          <View style={styles.statCard}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
            )}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
              style={StyleSheet.absoluteFill}
            />
            <Icon name="zap" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{(userStats?.xp ?? 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>

          {/* Streak Card */}
          <Pressable style={styles.statCard} onPress={() => router.push('/leaderboard')}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
            )}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
              style={StyleSheet.absoluteFill}
            />
            <StreakFire
              streak={userStats?.streak ?? 0}
              size="small"
              showCount={false}
              atRisk={userStats?.streakAtRisk ?? false}
            />
            <Text style={styles.statValue}>{userStats?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>STREAK</Text>
          </Pressable>

          {/* Lessons Card */}
          <View style={styles.statCard}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
            )}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
              style={StyleSheet.absoluteFill}
            />
            <Icon name="book" size={24} color="#39FF14" />
            <Text style={styles.statValue}>{lessonsCompleted}</Text>
            <Text style={styles.statLabel}>DONE</Text>
          </View>
        </Animated.View>

        {/* Weekly rank pill */}
        {userStats?.userRank != null && (
          <Animated.View entering={FadeInDown.delay(240)}>
            <Pressable
              style={styles.rankPill}
              onPress={() => router.push('/leaderboard')}
            >
              <Text style={styles.rankPillIcon}>🏆</Text>
              <Text style={styles.rankPillText}>
                Tu es #{userStats.userRank} au classement hebdo
              </Text>
              <Icon name="chevron-right" size={14} color="#FFD700" />
            </Pressable>
          </Animated.View>
        )}

        {/* Level XP Progress Bar */}
        <Animated.View entering={FadeInDown.delay(280)} style={styles.levelProgressCard}>
          <View style={styles.levelProgressHeader}>
            <View style={styles.levelProgressLeft}>
              <View style={styles.levelCircle}>
                <Text style={styles.levelCircleText}>{currentLevel}</Text>
              </View>
              <View>
                <Text style={styles.levelProgressLabel}>Niveau {currentLevel}</Text>
                <Text style={styles.levelProgressSub}>
                  {xpToNext === 0 ? 'MAX' : `${xpToNext.toLocaleString()} XP vers le niveau ${currentLevel + 1}`}
                </Text>
              </View>
            </View>
            <Text style={styles.levelProgressPct}>{Math.round(xpProgress)}%</Text>
          </View>
          <View style={styles.levelBar}>
            <Animated.View
              style={[styles.levelBarFill, { width: `${Math.min(100, xpProgress)}%` as any }]}
            />
          </View>
        </Animated.View>

        {/* Streak at-risk warning banner */}
        {userStats?.streakAtRisk && userStats.streak > 0 && (
          <Animated.View entering={FadeInDown.delay(295)}>
            <Pressable
              style={styles.streakRiskBanner}
              onPress={() => router.push('/(tabs)/learn')}
            >
              <View style={styles.streakRiskLeft}>
                <Text style={styles.streakRiskEmoji}>🔥</Text>
                <View>
                  <Text style={styles.streakRiskTitle}>Streak en danger !</Text>
                  <Text style={styles.streakRiskSub}>Fais une leçon pour garder ton streak de {userStats.streak} jours</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={16} color="#FF6B35" />
            </Pressable>
          </Animated.View>
        )}

        {/* Daily XP Goal */}
        <Animated.View entering={FadeInDown.delay(298)} style={styles.dailyGoalWrapper}>
          <DailyGoalCard
            goal={dailyGoal.goal}
            xpToday={dailyGoal.xpToday}
            progress={dailyGoal.progress}
            isReached={dailyGoal.isGoalReached}
          />
        </Animated.View>

        {/* Daily Challenge */}
        {dailyChallenge && !dailyChallenge.isCompleted && (
          <Animated.View entering={FadeInDown.delay(300)}>
            <Pressable
              style={styles.dailyCard}
              onPress={() => router.push('/daily-challenge')}
            >
              {Platform.OS === 'ios' ? (
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
              )}
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.dailyHeader}>
                <View style={styles.dailyBadge}>
                  <Icon name="target" size={14} color="#FFD700" />
                  <Text style={styles.dailyBadgeText}>DAILY</Text>
                </View>
                <Text style={styles.dailyBonus}>+{dailyChallenge.xpBonus} XP</Text>
              </View>
              <Text style={styles.dailyTitle}>{dailyChallenge.lesson.title}</Text>
              <View style={styles.dailyAction}>
                <Text style={styles.dailyActionText}>Tap to start</Text>
                <Icon name="chevron-right" size={16} color="#FFD700" />
              </View>
            </Pressable>
          </Animated.View>
        )}

        {dailyChallenge?.isCompleted && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.dailyCompleted}>
            <Icon name="check" size={18} color="#39FF14" />
            <Text style={styles.dailyCompletedText}>Daily Challenge Complete!</Text>
          </Animated.View>
        )}

        {/* ⚔️ Pending Challenges */}
        {pendingChallenges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(320)} style={styles.pendingSection}>
            <View style={styles.pendingHeader}>
              <Text style={styles.pendingSectionTitle}>⚔️ Défis en attente</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingChallenges.length}</Text>
              </View>
            </View>
            {pendingChallenges.map((ch, idx) => {
              const domainColor =
                ch.lesson?.domain === 'CRYPTO'
                  ? '#F7931A'
                  : ch.lesson?.domain === 'FINANCE'
                  ? '#39FF14'
                  : '#58A6FF';
              return (
                <Animated.View
                  key={ch.id}
                  entering={FadeInDown.delay(330 + idx * 60)}
                  style={styles.challengeCard}
                >
                  {Platform.OS === 'ios' ? (
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
                  )}
                  <LinearGradient
                    colors={['rgba(248,81,73,0.08)', 'rgba(248,81,73,0.02)']}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Challenger info */}
                  <View style={styles.challengeTop}>
                    <View style={styles.challengerRow}>
                      <Text style={styles.challengerAvatar}>
                        {(ch.challenger?.username ?? '?')[0].toUpperCase()}
                      </Text>
                      <View>
                        <Text style={styles.challengerName}>
                          {ch.challenger?.username ?? '...'}
                        </Text>
                        <Text style={styles.challengeLabel}>t'a lancé un défi</Text>
                      </View>
                    </View>
                    {ch.lesson && (
                      <View style={[styles.challengeDomain, { borderColor: domainColor + '60' }]}>
                        <Text style={[styles.challengeDomainText, { color: domainColor }]}>
                          {ch.lesson.domain}
                        </Text>
                      </View>
                    )}
                  </View>
                  {/* Lesson name */}
                  {ch.lesson && (
                    <Text style={styles.challengeLessonTitle} numberOfLines={1}>
                      📖 {ch.lesson.title}
                    </Text>
                  )}
                  {/* Buttons */}
                  <View style={styles.challengeActions}>
                    <Pressable
                      style={[styles.challengeBtn, styles.challengeBtnDecline]}
                      onPress={() => handleRespondChallenge(ch.id, 'DECLINED')}
                      disabled={respondingId === ch.id}
                    >
                      <Text style={styles.challengeBtnDeclineText}>Refuser</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.challengeBtn, styles.challengeBtnAccept]}
                      onPress={() => handleRespondChallenge(ch.id, 'ACCEPTED')}
                      disabled={respondingId === ch.id}
                    >
                      {respondingId === ch.id ? (
                        <ActivityIndicator size="small" color="#0D1117" />
                      ) : (
                        <Text style={styles.challengeBtnAcceptText}>⚔️ Accepter</Text>
                      )}
                    </Pressable>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {/* Streak Calendar */}
        {userStats !== null && (
          <Animated.View entering={FadeInDown.delay(380)} style={{ marginBottom: 20 }}>
            <StreakCalendar
              streak={userStats.streak}
              atRisk={userStats.streakAtRisk}
            />
          </Animated.View>
        )}

        {/* Continue Learning */}
        {currentLesson && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Pressable
              style={styles.continueCard}
              onPress={() => router.push(`/lesson/${currentLesson.id}`)}
            >
              {Platform.OS === 'ios' ? (
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
              )}
              <LinearGradient
                colors={['rgba(57, 255, 20, 0.1)', 'rgba(57, 255, 20, 0.02)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.continueHeader}>
                <Text style={styles.continueLabel}>CONTINUE</Text>
                <View style={styles.domainBadge}>
                  <Text style={styles.domainText}>{currentLesson.domain}</Text>
                </View>
              </View>
              <Text style={styles.continueTitle}>{currentLesson.title}</Text>
              <View style={styles.continueProgress}>
                <ProgressBar progress={currentLesson.progress} variant="neon" height={6} />
                <Text style={styles.continuePercent}>{currentLesson.progress}%</Text>
              </View>
              <View style={styles.continueAction}>
                <Text style={styles.continueActionText}>Resume lesson</Text>
                <Icon name="arrow-right" size={18} color="#39FF14" />
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Overall Progress */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Learning Path</Text>
            <Text style={styles.progressCount}>{lessonsCompleted}/{totalLessons} leçons</Text>
          </View>
          {/* Global bar */}
          <View style={styles.globalBarRow}>
            <ProgressBar progress={progressPercent} variant="default" height={8} />
            <Text style={styles.globalBarPct}>{Math.round(progressPercent)}%</Text>
          </View>

          {/* Per-domain breakdown */}
          {userStats?.domainStats && userStats.domainStats.length > 0 && (
            <View style={styles.domainBreakdown}>
              {userStats.domainStats.map((ds) => {
                const pct = ds.total > 0 ? Math.round((ds.completed / ds.total) * 100) : 0;
                const domainColor =
                  ds.domain === 'CRYPTO' ? '#F7931A'
                  : ds.domain === 'FINANCE' ? '#39FF14'
                  : '#00CFFF'; // TRADING
                return (
                  <View key={ds.domain} style={styles.domainRow}>
                    <View style={styles.domainRowLeft}>
                      <Text style={styles.domainEmoji}>{ds.emoji}</Text>
                      <Text style={styles.domainLabel}>{ds.label}</Text>
                    </View>
                    <View style={styles.domainBarContainer}>
                      <View style={styles.domainBarBg}>
                        <View style={[styles.domainBarFill, { width: `${pct}%` as any, backgroundColor: domainColor }]} />
                      </View>
                    </View>
                    <Text style={[styles.domainPct, { color: domainColor }]}>{pct}%</Text>
                    <Text style={styles.domainCount}>{ds.completed}/{ds.total}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <Pressable style={styles.viewAllButton} onPress={() => router.push('/(tabs)/learn')}>
            <Text style={styles.viewAllText}>Voir toutes les leçons</Text>
            <Icon name="chevron-right" size={16} color="#8B949E" />
          </Pressable>
        </Animated.View>

        {/* Weekly Recap Card */}
        <Animated.View entering={FadeInDown.delay(560)}>
          <Pressable
            style={styles.weeklyRecapCard}
            onPress={() => router.push('/weekly-recap' as any)}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
            )}
            <LinearGradient
              colors={['rgba(57, 255, 20, 0.08)', 'rgba(57, 255, 20, 0.02)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.weeklyRecapInner}>
              <View style={styles.weeklyRecapLeft}>
                <Text style={styles.weeklyRecapLabel}>📅 THIS WEEK</Text>
                <Text style={styles.weeklyRecapTitle}>View Weekly Recap</Text>
                <Text style={styles.weeklyRecapSub}>Progress · Stats · Message</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#39FF14" />
            </View>
          </Pressable>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={() => router.push('/leaderboard')}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
            )}
            <Icon name="trophy" size={20} color="#FFD700" />
            <Text style={styles.quickActionText}>Leaderboard</Text>
            <Icon name="chevron-right" size={16} color="#484F58" />
          </Pressable>

          <Pressable style={styles.quickAction} onPress={() => router.push('/(tabs)/profile')}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
            )}
            <Icon name="user" size={20} color="#58A6FF" />
            <Text style={styles.quickActionText}>Profile</Text>
            <Icon name="chevron-right" size={16} color="#484F58" />
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Achievement Unlocked Celebration */}
      <AchievementUnlockedModal
        visible={!!newlyUnlocked}
        achievement={newlyUnlocked?.achievement ?? null}
        onDismiss={clearNewlyUnlocked}
      />

      {/* Daily Goal Celebration */}
      <GoalCelebrationModal
        visible={showCelebration}
        goal={dailyGoal.goal}
        onDismiss={dailyGoal.markCelebrated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
  },
  username: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  // Streak at-risk banner
  streakRiskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.4)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  streakRiskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  streakRiskEmoji: {
    fontSize: 24,
  },
  streakRiskTitle: {
    fontSize: 14,
    color: '#FF6B35',
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  streakRiskSub: {
    fontSize: 11,
    color: '#8B949E',
    fontFamily: 'Inter',
    marginTop: 1,
  },
  // Daily goal wrapper
  dailyGoalWrapper: {
    marginBottom: 16,
  },
  // Level Progress
  levelProgressCard: {
    marginBottom: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    padding: 14,
    gap: 10,
  },
  levelProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelProgressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(57,255,20,0.15)',
    borderWidth: 2,
    borderColor: '#39FF14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelCircleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#39FF14',
    fontFamily: 'JetBrainsMono',
  },
  levelProgressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E6EDF3',
    fontFamily: 'Inter',
  },
  levelProgressSub: {
    fontSize: 11,
    color: '#8B949E',
    fontFamily: 'Inter',
    marginTop: 1,
  },
  levelProgressPct: {
    fontSize: 16,
    fontWeight: '700',
    color: '#39FF14',
    fontFamily: 'JetBrainsMono',
  },
  levelBar: {
    height: 8,
    backgroundColor: '#21262D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    backgroundColor: '#39FF14',
    borderRadius: 4,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
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
    marginBottom: 20,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  rankPillIcon: {
    fontSize: 16,
  },
  rankPillText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    flex: 1,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  androidBlur: {
    backgroundColor: 'rgba(22, 27, 34, 0.95)',
  },
  statValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 20,
    fontWeight: '700',
    color: '#E6EDF3',
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#8B949E',
    marginTop: 2,
  },
  dailyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
  },
  dailyBonus: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  dailyTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#E6EDF3',
    marginBottom: 12,
  },
  dailyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dailyActionText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#FFD700',
  },
  dailyCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    marginBottom: 20,
  },
  dailyCompletedText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    fontWeight: '600',
    color: '#39FF14',
  },
  continueCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  continueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  continueLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#39FF14',
  },
  domainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(88, 166, 255, 0.15)',
  },
  domainText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '600',
    color: '#58A6FF',
  },
  continueTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#E6EDF3',
    marginBottom: 16,
  },
  continueProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  continuePercent: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '600',
    color: '#39FF14',
    minWidth: 40,
  },
  continueAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  continueActionText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#39FF14',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  progressCount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    color: '#8B949E',
  },
  globalBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  globalBarPct: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#58A6FF',
    minWidth: 36,
    textAlign: 'right',
  },
  domainBreakdown: {
    gap: 10,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 4,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  domainRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: 90,
  },
  domainEmoji: {
    fontSize: 14,
  },
  domainLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#C9D1D9',
    flexShrink: 1,
  },
  domainBarContainer: {
    flex: 1,
  },
  domainBarBg: {
    height: 6,
    backgroundColor: '#21262D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  domainBarFill: {
    height: 6,
    borderRadius: 3,
  },
  domainPct: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
  domainCount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#484F58',
    minWidth: 36,
    textAlign: 'right',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
  },
  viewAllText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
  },
  // Weekly Recap Card
  weeklyRecapCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
    marginBottom: 4,
  },
  weeklyRecapInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  weeklyRecapLeft: {
    flex: 1,
    gap: 3,
  },
  weeklyRecapLabel: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'Inter-Bold',
  },
  weeklyRecapTitle: {
    color: '#E6EDF3',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  weeklyRecapSub: {
    color: '#8B949E',
    fontSize: 12,
    fontFamily: 'Inter',
  },

  quickActions: {
    gap: 10,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickActionText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#E6EDF3',
  },

  // ── Pending Challenges Section ─────────────────────────────────────────────
  pendingSection: {
    marginBottom: 20,
    gap: 12,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pendingSectionTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  pendingBadge: {
    backgroundColor: '#F85149',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  pendingBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  challengeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(248,81,73,0.3)',
    gap: 10,
  },
  challengeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  challengerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(248,81,73,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(248,81,73,0.5)',
    textAlign: 'center',
    lineHeight: 36,
    fontSize: 16,
    fontWeight: '700',
    color: '#F85149',
    fontFamily: 'JetBrainsMono',
    overflow: 'hidden',
  },
  challengerName: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  challengeLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    marginTop: 1,
  },
  challengeDomain: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  challengeDomainText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '700',
  },
  challengeLessonTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#C9D1D9',
  },
  challengeActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  challengeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeBtnDecline: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  challengeBtnDeclineText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#8B949E',
  },
  challengeBtnAccept: {
    backgroundColor: '#39FF14',
  },
  challengeBtnAcceptText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#0D1117',
  },
});
