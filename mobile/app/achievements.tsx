import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useUser } from '@/hooks/useUser';
import { useAchievements, getRarityColor } from '@/hooks/useAchievements';
import { Icon } from '@/components/ui/Icon';
import { AchievementCard } from '@/components/ui/AchievementCard';
import { AchievementCategory } from '@/api/client';

type FilterType = 'ALL' | 'UNLOCKED' | 'LOCKED';

const CATEGORY_ORDER: AchievementCategory[] = ['LEARNING', 'STREAK', 'XP', 'SOCIAL', 'SPECIAL'];
const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  LEARNING: 'Learning',
  STREAK: 'Streaks',
  XP: 'XP & Levels',
  SOCIAL: 'Social',
  SPECIAL: 'Special',
};

/**
 * Achievements Screen - Full list of achievements
 */
export default function AchievementsScreen() {
  const { userId, isLoading: isUserLoading } = useUser();
  const { achievements, isLoading } = useAchievements(userId);
  const [filter, setFilter] = useState<FilterType>('ALL');

  // Count achievements
  const unlockedCount = achievements?.unlocked.length ?? 0;
  const totalCount = unlockedCount + (achievements?.locked.length ?? 0);

  // Filter and group achievements by category
  const groupedAchievements = useMemo(() => {
    if (!achievements) return {};

    const groups: Record<string, Array<{ achievement: any; isUnlocked: boolean; unlockedAt?: string; progress?: number }>> = {};

    // Add unlocked achievements
    if (filter !== 'LOCKED') {
      for (const ua of achievements.unlocked) {
        const category = ua.achievement.category;
        if (!groups[category]) groups[category] = [];
        groups[category].push({
          achievement: ua.achievement,
          isUnlocked: true,
          unlockedAt: ua.unlockedAt,
        });
      }
    }

    // Add locked achievements
    if (filter !== 'UNLOCKED') {
      for (const a of achievements.locked) {
        const category = a.category;
        if (!groups[category]) groups[category] = [];
        groups[category].push({
          achievement: a,
          isUnlocked: false,
          progress: a.progress,
        });
      }
    }

    // Sort each group by orderIndex
    for (const category of Object.keys(groups)) {
      groups[category].sort((a, b) => a.achievement.orderIndex - b.achievement.orderIndex);
    }

    return groups;
  }, [achievements, filter]);

  if (isUserLoading || !userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          (<View style={{padding:20,gap:12}}>{[0,1,2,3,4].map(i=><SkeletonBox key={i} height={80} borderRadius={16}/>)}</View>)
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#E6EDF3" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Achievements</Text>
          <Text style={styles.headerSubtitle}>
            {unlockedCount}/{totalCount} unlocked
          </Text>
        </View>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Filter Tabs */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.filterContainer}>
        <Pressable
          style={[styles.filterTab, filter === 'ALL' && styles.filterTabActive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>All</Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, filter === 'UNLOCKED' && styles.filterTabActive]}
          onPress={() => setFilter('UNLOCKED')}
        >
          <Text style={[styles.filterText, filter === 'UNLOCKED' && styles.filterTextActive]}>
            Unlocked ({unlockedCount})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, filter === 'LOCKED' && styles.filterTabActive]}
          onPress={() => setFilter('LOCKED')}
        >
          <Text style={[styles.filterText, filter === 'LOCKED' && styles.filterTextActive]}>
            Locked
          </Text>
        </Pressable>
      </Animated.View>

      {/* Achievement List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            (<View style={{padding:20,gap:12}}>{[0,1,2,3,4].map(i=><SkeletonBox key={i} height={80} borderRadius={16}/>)}</View>)
          </View>
        ) : (
          CATEGORY_ORDER.map((category, categoryIndex) => {
            const items = groupedAchievements[category];
            if (!items || items.length === 0) return null;

            return (
              <Animated.View
                key={category}
                entering={FadeInUp.delay(150 + categoryIndex * 50)}
                style={styles.categorySection}
              >
                <Text style={styles.categoryTitle}>{CATEGORY_LABELS[category]}</Text>
                <View style={styles.achievementsList}>
                  {items.map((item) => (
                    <AchievementCard
                      key={item.achievement.id}
                      achievement={item.achievement}
                      isUnlocked={item.isUnlocked}
                      unlockedAt={item.unlockedAt}
                      progress={item.progress}
                    />
                  ))}
                </View>
              </Animated.View>
            );
          })
        )}

        {/* Empty state */}
        {!isLoading && filter === 'UNLOCKED' && unlockedCount === 0 && (
          <View style={styles.emptyState}>
            <Icon name="trophy" size={48} color="#484F58" />
            <Text style={styles.emptyTitle}>No achievements yet</Text>
            <Text style={styles.emptyText}>
              Complete lessons and maintain your streak to unlock achievements!
            </Text>
          </View>
        )}
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  headerSubtitle: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#161B22',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#39FF14',
  },
  filterText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#8B949E',
  },
  filterTextActive: {
    color: '#0D1117',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
    paddingBottom: 32,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  categorySection: {
    gap: 12,
  },
  categoryTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 4,
  },
  achievementsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#8B949E',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#484F58',
    textAlign: 'center',
    maxWidth: 280,
  },
});
