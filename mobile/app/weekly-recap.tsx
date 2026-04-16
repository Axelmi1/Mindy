/**
 * Weekly Recap Screen
 *
 * Motivational weekly learning summary.
 * Shows XP earned, lessons, active days, domain breakdown,
 * a 7-bar activity chart, comparison with last week, and
 * a personalized message + badge.
 *
 * Accessible from Home screen via a "This Week" card.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { weeklyRecapApi, type WeeklyRecap, type DayActivity } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';

const { width: W } = Dimensions.get('window');
const MARGIN = 20;
const CONTENT_W = W - MARGIN * 2;

const DOMAIN_COLORS: Record<string, string> = {
  CRYPTO: '#F7931A',
  FINANCE: '#3B82F6',
  TRADING: '#A855F7',
};
const DOMAIN_EMOJI: Record<string, string> = {
  CRYPTO: '₿',
  FINANCE: '💰',
  TRADING: '📈',
};

// ────────────────────────────────────────────────────────────────────────────

function AnimatedBar({
  value,
  maxValue,
  color,
  delay,
}: {
  value: number;
  maxValue: number;
  color: string;
  delay: number;
}) {
  const MAX_H = 72;
  const barH = useSharedValue(0);

  useEffect(() => {
    const targetH = maxValue > 0 ? Math.max(4, (value / maxValue) * MAX_H) : 4;
    barH.value = withDelay(delay, withSpring(targetH, { damping: 14, stiffness: 100 }));
  }, [value, maxValue]);

  const style = useAnimatedStyle(() => ({
    height: barH.value,
  }));

  return (
    <View style={{ height: MAX_H, justifyContent: 'flex-end' }}>
      <Animated.View
        style={[
          {
            width: 24,
            borderRadius: 4,
            backgroundColor: value > 0 ? color : '#21262D',
          },
          style,
        ]}
      />
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  delay,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(delay)} style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export default function WeeklyRecapScreen() {
  const { userId } = useUser();
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    weeklyRecapApi
      .getRecap(userId)
      .then((res) => {
        if (res.data) setRecap(res.data);
        else setError('No data returned');
      })
      .catch((e) => setError(e.message ?? 'Failed to load recap'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#39FF14" />
          <Text style={styles.loadingText}>Loading your week…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !recap) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingCenter}>
          <Text style={styles.errorText}>Failed to load recap 😕</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const maxXp = Math.max(...recap.dailyActivity.map((d) => d.xpEarned), 1);
  const weekLabel = `${formatDate(recap.weekStart)} – ${formatDate(recap.weekEnd)}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={22} color="#E6EDF3" />
        </Pressable>
        <Text style={styles.headerTitle}>Weekly Recap</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <Animated.View entering={FadeIn.delay(50)}>
          <LinearGradient
            colors={['#0F2027', '#1A3A2A', '#0D1117']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Badge */}
            {recap.badge && (
              <View style={styles.badgeRow}>
                <Text style={styles.badgeText}>{recap.badge}</Text>
              </View>
            )}

            <Text style={styles.weekLabel}>{weekLabel}</Text>

            <Text style={styles.heroXp}>
              +{recap.xpThisWeek.toLocaleString()} XP
            </Text>
            <Text style={styles.heroSub}>earned this week</Text>

            {/* XP delta */}
            {recap.xpDelta !== 0 && (
              <View style={styles.deltaRow}>
                <Icon
                  name={recap.xpDelta > 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={recap.xpDelta > 0 ? '#39FF14' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.deltaText,
                    { color: recap.xpDelta > 0 ? '#39FF14' : '#EF4444' },
                  ]}
                >
                  {recap.xpDelta > 0 ? '+' : ''}
                  {recap.xpDelta} vs last week
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Lessons"
            value={String(recap.lessonsThisWeek)}
            sub={recap.lessonsDelta > 0 ? `+${recap.lessonsDelta} vs last week` : undefined}
            color="#39FF14"
            delay={100}
          />
          <StatCard
            label="Active Days"
            value={`${recap.activeDays}/7`}
            color="#F7931A"
            delay={150}
          />
          <StatCard
            label="Streak"
            value={`${recap.currentStreak} 🔥`}
            color="#FFD700"
            delay={200}
          />
        </View>

        {/* Daily activity bar chart */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Activity</Text>
          <View style={styles.barChart}>
            {recap.dailyActivity.map((day, i) => (
              <View key={day.date} style={styles.barCol}>
                <AnimatedBar
                  value={day.xpEarned}
                  maxValue={maxXp}
                  color="#39FF14"
                  delay={i * 60}
                />
                <Text style={styles.barDayLabel}>{day.dayName}</Text>
                {day.xpEarned > 0 && (
                  <Text style={styles.barXpLabel}>{day.xpEarned}</Text>
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Domain breakdown */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Domain Breakdown</Text>
          <View style={styles.domainRow}>
            {Object.entries(recap.domainBreakdown).map(([domain, count]) => (
              <View key={domain} style={styles.domainChip}>
                <Text style={styles.domainEmoji}>{DOMAIN_EMOJI[domain]}</Text>
                <View>
                  <Text style={[styles.domainName, { color: DOMAIN_COLORS[domain] }]}>
                    {domain.charAt(0) + domain.slice(1).toLowerCase()}
                  </Text>
                  <Text style={styles.domainCount}>
                    {count} lesson{count !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Best day */}
        {recap.bestDay && recap.bestDay.xpEarned > 0 && (
          <Animated.View entering={FadeInUp.delay(380)} style={styles.section}>
            <Text style={styles.sectionTitle}>Best Day</Text>
            <View style={styles.bestDayCard}>
              <Text style={styles.bestDayDay}>
                {recap.bestDay.dayName}
              </Text>
              <View>
                <Text style={styles.bestDayXp}>
                  +{recap.bestDay.xpEarned} XP
                </Text>
                <Text style={styles.bestDaySub}>
                  {recap.bestDay.lessonsCompleted} lesson
                  {recap.bestDay.lessonsCompleted !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.bestDayTrophy}>🏅</Text>
            </View>
          </Animated.View>
        )}

        {/* Mindy message */}
        <Animated.View entering={FadeInUp.delay(460)} style={styles.messageCard}>
          <View style={styles.mindyAvatar}>
            <Text style={styles.mindyAvatarText}>🤖</Text>
          </View>
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{recap.message}</Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(520)}>
          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push('/(tabs)/learn' as any)}
          >
            <LinearGradient
              colors={['#39FF14', '#00C87A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Icon name="zap" size={18} color="#0D1117" />
              <Text style={styles.ctaText}>Start a Lesson Now</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8B949E',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
  },
  backBtn: {
    padding: 12,
    backgroundColor: '#161B22',
    borderRadius: 10,
  },
  backBtnText: {
    color: '#39FF14',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: MARGIN,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161B22',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E6EDF3',
    fontFamily: 'Inter-Bold',
  },

  scroll: {
    paddingHorizontal: MARGIN,
    paddingTop: 16,
    gap: 16,
  },

  // Hero
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#39FF1440',
  },
  badgeRow: {
    backgroundColor: '#39FF1420',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#39FF1440',
  },
  badgeText: {
    color: '#39FF14',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  weekLabel: {
    color: '#8B949E',
    fontSize: 12,
    marginBottom: 6,
    fontFamily: 'Inter',
  },
  heroXp: {
    fontSize: 42,
    fontWeight: '800',
    color: '#39FF14',
    fontFamily: 'Inter-Bold',
    letterSpacing: -1,
  },
  heroSub: {
    color: '#8B949E',
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    backgroundColor: '#0D1117',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  deltaText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    color: '#8B949E',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Inter',
  },
  statSub: {
    color: '#39FF14',
    fontSize: 9,
    marginTop: 3,
    fontFamily: 'Inter',
  },

  // Section
  section: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  sectionTitle: {
    color: '#E6EDF3',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
    fontFamily: 'Inter-Bold',
  },

  // Bar chart
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 4,
  },
  barCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barDayLabel: {
    color: '#8B949E',
    fontSize: 10,
    fontFamily: 'Inter',
  },
  barXpLabel: {
    color: '#39FF14',
    fontSize: 9,
    fontFamily: 'Inter-Bold',
  },

  // Domain
  domainRow: {
    gap: 10,
  },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0D1117',
    borderRadius: 10,
    padding: 10,
  },
  domainEmoji: {
    fontSize: 24,
  },
  domainName: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  domainCount: {
    color: '#8B949E',
    fontSize: 12,
    fontFamily: 'Inter',
  },

  // Best day
  bestDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  bestDayDay: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E6EDF3',
    width: 56,
    fontFamily: 'Inter-Bold',
  },
  bestDayXp: {
    fontSize: 18,
    fontWeight: '700',
    color: '#39FF14',
    fontFamily: 'Inter-Bold',
  },
  bestDaySub: {
    color: '#8B949E',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  bestDayTrophy: {
    fontSize: 28,
    marginLeft: 'auto',
  },

  // Message
  messageCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  mindyAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#161B22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#39FF14',
    flexShrink: 0,
  },
  mindyAvatarText: {
    fontSize: 22,
  },
  messageBubble: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  messageText: {
    color: '#E6EDF3',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter',
  },

  // CTA
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D1117',
    fontFamily: 'Inter-Bold',
  },
});
