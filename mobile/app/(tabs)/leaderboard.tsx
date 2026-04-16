import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { leaderboardApi, LeaderboardEntry, UserWeeklyStats } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { LeagueBadge } from '@/components/ui/LeagueBadge';

// ─── League tiers (mirrors server scheduler) ────────────────────────────────

const LEAGUE_TIERS = [
  { rank: 0, name: 'Iron',     minXp: 0,    emoji: '⚙️' },
  { rank: 1, name: 'Bronze',   minXp: 100,  emoji: '🥉' },
  { rank: 2, name: 'Silver',   minXp: 500,  emoji: '🥈' },
  { rank: 3, name: 'Gold',     minXp: 2000, emoji: '🥇' },
  { rank: 4, name: 'Platinum', minXp: 5000, emoji: '💠' },
] as const;

interface LeagueInfo {
  current: { rank: number; name: string; emoji: string; minXp: number };
  next:    { rank: number; name: string; emoji: string; minXp: number } | null;
  progress: number; // 0–1
  xpIntoTier: number;
  xpNeeded: number;
}

function getLeagueInfo(xp: number): LeagueInfo {
  let currentIdx = 0;
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEAGUE_TIERS[i].minXp) { currentIdx = i; break; }
  }
  const current = LEAGUE_TIERS[currentIdx];
  const next    = currentIdx < LEAGUE_TIERS.length - 1
    ? LEAGUE_TIERS[currentIdx + 1]
    : null;

  if (!next) {
    return { current, next: null, progress: 1, xpIntoTier: xp - current.minXp, xpNeeded: 0 };
  }
  const tierSize   = next.minXp - current.minXp;
  const xpIntoTier = xp - current.minXp;
  const progress   = Math.min(xpIntoTier / tierSize, 1);
  return { current, next, progress, xpIntoTier, xpNeeded: next.minXp - xp };
}

// ─── League Progress Card ────────────────────────────────────────────────────

function LeagueProgressCard({ totalXp }: { totalXp: number }) {
  const info = getLeagueInfo(totalXp);

  return (
    <Animated.View entering={FadeInUp.duration(350).delay(160)} style={{ marginBottom: 12 }}>
      <GlassCard borderColor="rgba(57,255,20,0.25)">
        {/* Header row */}
        <View style={lpStyles.header}>
          <Text style={lpStyles.sectionLabel}>PROGRESSION DE LIGUE</Text>
          {info.next ? (
            <Text style={lpStyles.xpNeeded}>
              {info.xpNeeded.toLocaleString()} XP pour {info.next.emoji} {info.next.name}
            </Text>
          ) : (
            <Text style={lpStyles.maxLeague}>🏆 Rang max atteint</Text>
          )}
        </View>

        {/* League tiers row */}
        <View style={lpStyles.tiersRow}>
          {LEAGUE_TIERS.map((tier, idx) => {
            const isActive  = info.current.rank === tier.rank;
            const isPast    = totalXp >= tier.minXp;
            return (
              <View key={tier.name} style={lpStyles.tierItem}>
                <Text style={[lpStyles.tierEmoji, isActive && lpStyles.tierEmojiActive]}>
                  {tier.emoji}
                </Text>
                <Text style={[
                  lpStyles.tierName,
                  isPast  && lpStyles.tierNamePast,
                  isActive && lpStyles.tierNameActive,
                ]}>
                  {tier.name}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Progress bar */}
        <View style={lpStyles.barTrack}>
          <View style={[lpStyles.barFill, { width: `${Math.round(info.progress * 100)}%` }]} />
        </View>

        {/* Label */}
        <Text style={lpStyles.progressLabel}>
          {info.next
            ? `${info.xpIntoTier.toLocaleString()} / ${(info.next.minXp - info.current.minXp).toLocaleString()} XP · ${Math.round(info.progress * 100)}%`
            : `${totalXp.toLocaleString()} XP total — Ligue maximale !`}
        </Text>
      </GlassCard>
    </Animated.View>
  );
}

const lpStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#39FF14',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  xpNeeded: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#8B949E',
  },
  maxLeague: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#FFD700',
  },
  tiersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  tierEmoji: {
    fontSize: 18,
    opacity: 0.3,
  },
  tierEmojiActive: {
    opacity: 1,
  },
  tierName: {
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    color: '#484F58',
    textAlign: 'center',
  },
  tierNamePast: {
    color: '#6E7681',
  },
  tierNameActive: {
    color: '#39FF14',
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#21262D',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: 6,
    backgroundColor: '#39FF14',
    borderRadius: 3,
    shadowColor: '#39FF14',
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  progressLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#6E7681',
    textAlign: 'center',
  },
});

// ─── Glass Card ─────────────────────────────────────────────────────────────

function GlassCard({
  children,
  style,
  borderColor = 'rgba(255,255,255,0.1)',
}: {
  children: React.ReactNode;
  style?: object;
  borderColor?: string;
}) {
  return (
    <View style={[glassStyles.wrapper, style]}>
      <View style={[glassStyles.inner, { borderColor }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, glassStyles.androidBg]} />
        )}
        <LinearGradient
          colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)'] as const}
          style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
        />
        <View style={glassStyles.content}>{children}</View>
      </View>
    </View>
  );
}

const glassStyles = StyleSheet.create({
  wrapper: { borderRadius: 16, overflow: 'hidden' },
  inner: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  androidBg: { backgroundColor: 'rgba(22, 27, 34, 0.9)' },
  content: { padding: 16 },
});

// ─── Medal badge ─────────────────────────────────────────────────────────────

function MedalBadge({ rank }: { rank: number }) {
  const config =
    rank === 1
      ? { color: '#FFD700', shadow: 'rgba(255,215,0,0.5)', label: '1' }
      : rank === 2
      ? { color: '#C0C0C0', shadow: 'rgba(192,192,192,0.5)', label: '2' }
      : { color: '#CD7F32', shadow: 'rgba(205,127,50,0.5)', label: '3' };

  return (
    <View
      style={[
        styles.medal,
        {
          backgroundColor: config.color,
          shadowColor: config.shadow,
          shadowOpacity: 0.8,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 4,
        },
      ]}
    >
      <Text style={styles.medalText}>{config.label}</Text>
    </View>
  );
}

// ─── Leaderboard Entry ───────────────────────────────────────────────────────

function LeaderboardRow({
  item,
  index,
}: {
  item: LeaderboardEntry;
  index: number;
}) {
  const isTop3 = item.rank <= 3;
  const borderColor = item.isCurrentUser
    ? '#39FF14'
    : isTop3
    ? '#FFD70050'
    : '#30363D';

  return (
    <Animated.View entering={FadeInDown.duration(250).delay(index * 40)}>
      <GlassCard
        style={{ marginBottom: 8 }}
        borderColor={borderColor}
      >
        <View style={styles.rowInner}>
          {/* Rank */}
          <View style={styles.rankCol}>
            {isTop3 ? (
              <MedalBadge rank={item.rank} />
            ) : (
              <Text style={styles.rankNum}>{item.rank}</Text>
            )}
          </View>

          {/* Username + delta */}
          <View style={styles.userCol}>
            <View style={styles.usernameRow}>
              <Text
                style={[
                  styles.username,
                  item.isCurrentUser && styles.usernameYou,
                ]}
                numberOfLines={1}
              >
                {item.username}
              </Text>
              {item.isCurrentUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youText}>vous</Text>
                </View>
              )}
            </View>
            {typeof item.xpDelta === 'number' && item.xpDelta !== 0 && (
              <Text
                style={[
                  styles.delta,
                  item.xpDelta > 0 ? styles.deltaPos : styles.deltaNeg,
                ]}
              >
                {item.xpDelta > 0 ? '▲' : '▼'}{' '}
                {Math.abs(item.xpDelta).toLocaleString()} vs semaine dernière
              </Text>
            )}
          </View>

          {/* League badge */}
          <View style={styles.leagueCol}>
            <LeagueBadge xp={item.totalXp ?? 0} size="sm" showName={false} />
          </View>

          {/* Weekly XP */}
          <View style={styles.xpCol}>
            <Icon name="zap" size={13} color="#FFD700" />
            <Text style={styles.xpText}>
              {item.xpEarned.toLocaleString()}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const { userId, isLoading: isUserLoading } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null);
  const [userStats, setUserStats] = useState<UserWeeklyStats | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  const formatTimeUntilReset = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}j ${hours}h`;
    return `${hours}h`;
  };

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [leaderboardRes, statsRes] = await Promise.all([
        leaderboardApi.getWeekly(userId),
        leaderboardApi.getUserStats(userId),
      ]);

      if (leaderboardRes.success && leaderboardRes.data) {
        setLeaderboard(leaderboardRes.data.leaderboard);
        setUserPosition(leaderboardRes.data.userPosition);
      }
      if (statsRes.success && statsRes.data) {
        setUserStats(statsRes.data);
        setTimeUntilReset(formatTimeUntilReset(statsRes.data.timeUntilReset));
      }
    } catch (err) {
      console.error('Leaderboard load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isUserLoading && userId) loadData();
  }, [isUserLoading, userId, loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  // ── Loading skeleton ─────────────────────────────────────────────────────

  if (isUserLoading || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerArea}>
          <SkeletonBox height={28} width="55%" borderRadius={8} />
          <SkeletonBox height={12} width="35%" borderRadius={6} />
        </View>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <SkeletonBox height={88} borderRadius={16} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <SkeletonBox key={i} height={62} borderRadius={14} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const userNotInTop =
    userPosition && !leaderboard.find((e) => e.isCurrentUser);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => (
          <LeaderboardRow item={item} index={index} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFD700"
            colors={['#FFD700']}
          />
        }
        ListHeaderComponent={
          <>
            {/* ── Page header ──────────────────────────────────────── */}
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.headerArea}
            >
              <View style={styles.titleRow}>
                <Icon name="trophy" size={22} color="#FFD700" />
                <Text style={styles.title}>Classement</Text>
                <View style={styles.resetBadge}>
                  <Icon name="clock" size={12} color="#8B949E" />
                  <Text style={styles.resetText}>{timeUntilReset}</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>XP hebdomadaire · renouvelle chaque lundi</Text>
            </Animated.View>

            {/* ── User stats card ──────────────────────────────────── */}
            {userStats && (
              <Animated.View
                entering={FadeInUp.duration(350).delay(100)}
                style={{ marginBottom: 16 }}
              >
                <LinearGradient
                  colors={['#1A2400', '#0D1117'] as const}
                  style={styles.statsCard}
                >
                  <View style={styles.statsCardBorder} />

                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {userStats.xpThisWeek.toLocaleString()}
                    </Text>
                    <Text style={styles.statLabel}>XP semaine</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {userStats.rank ? `#${userStats.rank}` : '–'}
                    </Text>
                    <Text style={styles.statLabel}>Votre rang</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {userStats.totalParticipants}
                    </Text>
                    <Text style={styles.statLabel}>Participants</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* ── League Progress Bar ─────────────────────────────── */}
            {(userPosition?.totalXp != null || userStats) && (
              <LeagueProgressCard
                totalXp={userPosition?.totalXp ?? 0}
              />
            )}

            {/* ── Column headers ───────────────────────────────────── */}
            <View style={styles.colHeaders}>
              <Text style={[styles.colHeader, { width: 40 }]}>#</Text>
              <Text style={[styles.colHeader, { flex: 1 }]}>Joueur</Text>
              <Text style={[styles.colHeader, { width: 36 }]}>Ligue</Text>
              <Text style={[styles.colHeader, { width: 60, textAlign: 'right' }]}>XP</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="trophy" size={52} color="#30363D" />
            <Text style={styles.emptyTitle}>Pas encore de classement</Text>
            <Text style={styles.emptySubtitle}>
              Complète des leçons pour gagner des XP !
            </Text>
          </View>
        }
        ListFooterComponent={
          userNotInTop && userPosition ? (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={styles.footerSection}
            >
              <View style={styles.footerSeparator} />
              <Text style={styles.footerLabel}>Votre position</Text>
              <LeaderboardRow item={userPosition} index={0} />
            </Animated.View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  headerArea: {
    paddingTop: 8,
    paddingBottom: 16,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '800',
    color: '#E6EDF3',
  },
  subtitle: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#484F58',
    marginTop: 2,
  },
  resetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resetText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#39FF14',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  statsCardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#39FF14',
    opacity: 0.6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 20,
    fontWeight: '700',
    color: '#39FF14',
  },
  statLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#6E7681',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#30363D',
    marginVertical: 4,
  },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  colHeader: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#484F58',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Row styles
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankCol: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '800',
    color: '#0D1117',
  },
  rankNum: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    fontWeight: '600',
    color: '#6E7681',
  },
  userCol: {
    flex: 1,
    marginHorizontal: 10,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
    flexShrink: 1,
  },
  usernameYou: {
    color: '#39FF14',
  },
  youBadge: {
    backgroundColor: 'rgba(57,255,20,0.15)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  youText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#39FF14',
  },
  delta: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    marginTop: 2,
  },
  deltaPos: { color: '#39FF14' },
  deltaNeg: { color: '#F85149' },
  leagueCol: {
    width: 36,
    alignItems: 'center',
  },
  xpCol: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  xpText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#6E7681',
  },
  emptySubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#484F58',
    textAlign: 'center',
  },
  footerSection: {
    marginTop: 16,
    gap: 8,
  },
  footerSeparator: {
    height: 1,
    backgroundColor: '#21262D',
    marginVertical: 8,
  },
  footerLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#8B949E',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
});
