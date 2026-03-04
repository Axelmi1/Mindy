import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import type { Lesson, UserProgressWithLesson, UserStats } from '@mindy/shared';
import { lessonsApi, progressApi, usersApi, dailyChallengeApi, DailyChallenge } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { useAchievements } from '@/hooks/useAchievements';
import { StreakFire, AchievementUnlockedModal } from '@/components/animations';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface CurrentLesson {
  id: string;
  title: string;
  progress: number;
  domain: 'CRYPTO' | 'FINANCE';
  totalSteps: number;
  completedSteps: number;
}

/**
 * Home Screen - Polished Dashboard
 */
export default function HomeScreen() {
  const { userId, username: cachedUsername, isLoading: isUserLoading } = useUser();
  const { newlyUnlocked, clearNewlyUnlocked, refresh: refreshAchievements } = useAchievements(userId);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<CurrentLesson | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgressWithLesson[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);

  const completedCount = userProgress.filter(p => p.isCompleted).length;

  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      const [lessonsRes, progressRes, statsRes, challengeRes] = await Promise.all([
        lessonsApi.getAll(),
        progressApi.getByUser(userId).catch(() => ({ success: true, data: [] })),
        usersApi.getStats(userId).catch(() => null),
        dailyChallengeApi.getToday(userId).catch(() => null),
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

  // Redirect to login if no user (must be before any returns)
  useEffect(() => {
    if (!isUserLoading && !userId) {
      router.replace('/login');
    }
  }, [isUserLoading, userId]);

  if (isUserLoading || isLoading || !userId) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#39FF14" />
      </SafeAreaView>
    );
  }

  const totalLessons = userStats?.totalLessons ?? lessons.length;
  const lessonsCompleted = userStats?.lessonsCompleted ?? completedCount;
  const progressPercent = totalLessons > 0 ? (lessonsCompleted / totalLessons) * 100 : 0;

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
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.username}>{userStats?.username ?? cachedUsername ?? '...'}</Text>
          </View>
          <Pressable style={styles.levelBadge} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.levelText}>Lvl {userStats?.level ?? 1}</Text>
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
            <Text style={styles.progressCount}>{lessonsCompleted}/{totalLessons}</Text>
          </View>
          <ProgressBar progress={progressPercent} variant="default" height={8} />
          <Pressable style={styles.viewAllButton} onPress={() => router.push('/(tabs)/learn')}>
            <Text style={styles.viewAllText}>View all lessons</Text>
            <Icon name="chevron-right" size={16} color="#8B949E" />
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
});
