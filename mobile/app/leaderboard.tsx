import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { leaderboardApi, LeaderboardEntry, UserWeeklyStats } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';

/**
 * Leaderboard Screen
 * Weekly XP rankings
 */
export default function LeaderboardScreen() {
  const { userId, isLoading: isUserLoading } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null);
  const [userStats, setUserStats] = useState<UserWeeklyStats | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Format time until reset
  const formatTimeUntilReset = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  // Load leaderboard data
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
      console.error('Error loading leaderboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isUserLoading && userId) {
      loadData();
    }
  }, [isUserLoading, userId, loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  // Get medal icon for top 3
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return { color: '#FFD700', icon: '1st' }; // Gold
      case 2:
        return { color: '#C0C0C0', icon: '2nd' }; // Silver
      case 3:
        return { color: '#CD7F32', icon: '3rd' }; // Bronze
      default:
        return null;
    }
  };

  // Render leaderboard entry
  const renderEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const medal = getMedalIcon(item.rank);
    const isTop3 = item.rank <= 3;

    return (
      <Animated.View
        entering={FadeInDown.duration(300).delay(index * 50)}
        style={[
          styles.entryContainer,
          item.isCurrentUser && styles.entryCurrentUser,
          isTop3 && styles.entryTop3,
        ]}
      >
        <View style={styles.rankContainer}>
          {medal ? (
            <View style={[styles.medalBadge, { backgroundColor: medal.color }]}>
              <Text style={styles.medalText}>{item.rank}</Text>
            </View>
          ) : (
            <Text style={styles.rankText}>{item.rank}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.username, item.isCurrentUser && styles.usernameCurrentUser]}>
            {item.username}
            {item.isCurrentUser && ' (You)'}
          </Text>
        </View>

        <View style={styles.xpContainer}>
          <Icon name="zap" size={14} color="#FFD700" />
          <Text style={styles.xpText}>{item.xpEarned.toLocaleString()}</Text>
        </View>
      </Animated.View>
    );
  };

  // Loading state
  if (isUserLoading || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#8B949E" />
        </Pressable>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.timerBadge}>
          <Icon name="clock" size={14} color="#8B949E" />
          <Text style={styles.timerText}>{timeUntilReset}</Text>
        </View>
      </View>

      {/* User's weekly stats */}
      {userStats && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.userStatsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.xpThisWeek.toLocaleString()}</Text>
            <Text style={styles.statLabel}>XP this week</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {userStats.rank ? `#${userStats.rank}` : '-'}
            </Text>
            <Text style={styles.statLabel}>Your rank</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.totalParticipants}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>
        </Animated.View>
      )}

      {/* Leaderboard list */}
      <FlatList
        data={leaderboard}
        renderItem={renderEntry}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFD700"
            colors={['#FFD700']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="trophy" size={48} color="#30363D" />
            <Text style={styles.emptyText}>No rankings yet this week</Text>
            <Text style={styles.emptySubtext}>Complete lessons to earn XP!</Text>
          </View>
        }
        ListFooterComponent={
          userPosition && !leaderboard.find(e => e.isCurrentUser) ? (
            <View style={styles.userPositionFooter}>
              <Text style={styles.userPositionLabel}>Your position</Text>
              {renderEntry({ item: userPosition, index: 0 })}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
    marginLeft: 8,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161B22',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#8B949E',
    marginTop: 12,
  },
  userStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#161B22',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 16,
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
    color: '#FFD700',
  },
  statLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#8B949E',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#30363D',
    marginVertical: 4,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 14,
  },
  entryCurrentUser: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
  },
  entryTop3: {
    borderColor: '#FFD700',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  medalBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#0D1117',
  },
  rankText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '600',
    color: '#8B949E',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  usernameCurrentUser: {
    color: '#39FF14',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#8B949E',
  },
  emptySubtext: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#484F58',
  },
  userPositionFooter: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#30363D',
    gap: 8,
  },
  userPositionLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
    textAlign: 'center',
  },
});
