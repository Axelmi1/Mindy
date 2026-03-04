import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Lesson, UserProgressWithLesson } from '@mindy/shared';
import { lessonsApi, progressApi } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';

type Domain = 'CRYPTO' | 'FINANCE';

interface LessonNode {
  lesson: Lesson;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  progress: number;
  index: number;
}

export default function LearnScreen() {
  const { userId, isLoading: isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<Domain>('CRYPTO');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgressWithLesson[]>([]);

  // Redirect to login if no user
  useEffect(() => {
    if (!isUserLoading && !userId) {
      router.replace('/login');
    }
  }, [isUserLoading, userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      const [lessonsRes, progressRes] = await Promise.all([
        lessonsApi.getAll(),
        progressApi.getByUser(userId).catch(() => ({ success: true, data: [] })),
      ]);

      if (lessonsRes.success && lessonsRes.data) {
        setLessons(lessonsRes.data);
      }

      if (progressRes.success && progressRes.data) {
        setUserProgress(progressRes.data);
      }
    } catch (err) {
      console.error('Error loading learn data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getDomainLessons = useCallback((domain: Domain): LessonNode[] => {
    const domainLessons = lessons
      .filter(l => l.domain === domain)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return domainLessons.map((lesson, index) => {
      const progress = userProgress.find(p => p.lessonId === lesson.id);
      const totalSteps = lesson.content.steps.length;
      const completedSteps = progress?.completedSteps.length || 0;
      const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

      let status: LessonNode['status'] = 'locked';

      if (progress?.isCompleted) {
        status = 'completed';
      } else if (progress && completedSteps > 0) {
        status = 'in_progress';
      } else if (index === 0) {
        status = 'available';
      } else {
        const prevLesson = domainLessons[index - 1];
        const prevProgress = userProgress.find(p => p.lessonId === prevLesson.id);
        if (prevProgress?.isCompleted) {
          status = 'available';
        }
      }

      return { lesson, status, progress: progressPercent, index };
    });
  }, [lessons, userProgress]);

  const cryptoLessons = getDomainLessons('CRYPTO');
  const financeLessons = getDomainLessons('FINANCE');
  const currentLessons = selectedDomain === 'CRYPTO' ? cryptoLessons : financeLessons;

  const handleDomainChange = async (domain: Domain) => {
    if (domain === selectedDomain) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDomain(domain);
  };

  const handleLessonPress = async (node: LessonNode) => {
    if (node.status === 'locked') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/lesson/${node.lesson.id}`);
  };

  if (isUserLoading || isLoading || !userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#39FF14" />
        </View>
      </SafeAreaView>
    );
  }

  const accentColor = selectedDomain === 'CRYPTO' ? '#39FF14' : '#58A6FF';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learn</Text>
      </View>

      {/* Domain Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, selectedDomain === 'CRYPTO' && styles.tabActiveCrypto]}
          onPress={() => handleDomainChange('CRYPTO')}
        >
          <Text style={[styles.tabText, selectedDomain === 'CRYPTO' && styles.tabTextActiveCrypto]}>
            Crypto
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedDomain === 'FINANCE' && styles.tabActiveFinance]}
          onPress={() => handleDomainChange('FINANCE')}
        >
          <Text style={[styles.tabText, selectedDomain === 'FINANCE' && styles.tabTextActiveFinance]}>
            Finance
          </Text>
        </Pressable>
      </View>

      {/* Lessons List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentLessons.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="book" size={48} color="#484F58" />
            <Text style={styles.emptyText}>No lessons yet</Text>
          </View>
        ) : (
          currentLessons.map((node, idx) => (
            <Animated.View
              key={node.lesson.id}
              entering={FadeInDown.delay(idx * 80).duration(300)}
            >
              <Pressable
                style={[
                  styles.card,
                  node.status === 'available' && { borderLeftColor: accentColor },
                  node.status === 'in_progress' && { borderLeftColor: accentColor },
                  node.status === 'completed' && styles.cardCompleted,
                  node.status === 'locked' && styles.cardLocked,
                ]}
                onPress={() => handleLessonPress(node)}
                disabled={node.status === 'locked'}
              >
                {/* Left: Status */}
                <View style={[
                  styles.statusBadge,
                  node.status === 'completed' && styles.statusBadgeCompleted,
                  node.status === 'locked' && styles.statusBadgeLocked,
                  (node.status === 'available' || node.status === 'in_progress') && { backgroundColor: accentColor + '20', borderColor: accentColor },
                ]}>
                  {node.status === 'completed' ? (
                    <Icon name="check" size={16} color="#fff" />
                  ) : node.status === 'locked' ? (
                    <Icon name="lock" size={14} color="#484F58" />
                  ) : (
                    <Text style={[styles.statusNumber, { color: accentColor }]}>{node.index + 1}</Text>
                  )}
                </View>

                {/* Middle: Content */}
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, node.status === 'locked' && styles.cardTitleLocked]} numberOfLines={1}>
                    {node.lesson.title}
                  </Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardMetaText}>{node.lesson.content.steps.length} steps</Text>
                    <Text style={styles.cardMetaDot}>•</Text>
                    <Text style={styles.cardXp}>+{node.lesson.xpReward} XP</Text>
                  </View>
                  {node.status === 'in_progress' && (
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${node.progress}%`, backgroundColor: accentColor }]} />
                    </View>
                  )}
                </View>

                {/* Right: Arrow */}
                {node.status !== 'locked' && (
                  <Icon name="chevron-right" size={20} color={accentColor} />
                )}
              </Pressable>
            </Animated.View>
          ))
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActiveCrypto: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
  },
  tabActiveFinance: {
    backgroundColor: 'rgba(88, 166, 255, 0.15)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B949E',
  },
  tabTextActiveCrypto: {
    color: '#39FF14',
  },
  tabTextActiveFinance: {
    color: '#58A6FF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#484F58',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  cardCompleted: {
    borderLeftColor: '#238636',
    backgroundColor: 'rgba(35, 134, 54, 0.08)',
  },
  cardLocked: {
    opacity: 0.5,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#21262D',
    borderWidth: 2,
    borderColor: '#30363D',
  },
  statusBadgeCompleted: {
    backgroundColor: '#238636',
    borderColor: '#238636',
  },
  statusBadgeLocked: {
    backgroundColor: '#21262D',
    borderColor: '#30363D',
  },
  statusNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  cardTitleLocked: {
    color: '#484F58',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#8B949E',
  },
  cardMetaDot: {
    fontSize: 12,
    color: '#484F58',
  },
  cardXp: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#30363D',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
