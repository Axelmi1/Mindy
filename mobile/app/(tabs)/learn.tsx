import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Lesson, UserProgressWithLesson } from '@mindy/shared';
import { lessonsApi, progressApi } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { LinearGradient } from 'expo-linear-gradient';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Domain = 'CRYPTO' | 'FINANCE' | 'TRADING';
type DifficultyFilter = 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type ViewMode = 'path' | 'list';

interface LessonNode {
  lesson: Lesson;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  progress: number;
  index: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NODE_SIZE = 68;
const VERTICAL_GAP = 128;
const MILESTONE_EVERY = 5;

// Zigzag x-positions (relative 0–1) for snake path
const ZIGZAG = [0.5, 0.78, 0.5, 0.22, 0.5, 0.78, 0.5, 0.22];

function nodeX(idx: number): number {
  return SCREEN_WIDTH * ZIGZAG[idx % ZIGZAG.length] - NODE_SIZE / 2;
}
function nodeY(idx: number): number {
  return idx * VERTICAL_GAP + 24;
}
function nodeCX(idx: number): number { return nodeX(idx) + NODE_SIZE / 2; }
function nodeCY(idx: number): number { return nodeY(idx) + NODE_SIZE / 2; }

const DIFFICULTY_FILTERS: { label: string; value: DifficultyFilter }[] = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Débutant', value: 'BEGINNER' },
  { label: 'Intermédiaire', value: 'INTERMEDIATE' },
  { label: 'Avancé', value: 'ADVANCED' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MASTER QUIZ UNLOCK TOAST
// Shown once per domain when all regular lessons become completed
// ─────────────────────────────────────────────────────────────────────────────
function MasterQuizUnlockToast({
  domain,
  visible,
  onDismiss,
}: {
  domain: string;
  visible: boolean;
  onDismiss: () => void;
}) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(-100, { duration: 350 }, () => {
          runOnJS(onDismiss)();
        });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const domainLabel = domain === 'CRYPTO' ? '₿ Crypto' : domain === 'FINANCE' ? '💰 Finance' : '📊 Trading';
  const domainColor = domain === 'CRYPTO' ? '#F7931A' : domain === 'FINANCE' ? '#39FF14' : '#58A6FF';

  return (
    <Animated.View style={[toastStyles.container, animStyle]}>
      <View style={[toastStyles.inner, { borderColor: domainColor + '60' }]}>
        <Text style={toastStyles.trophyEmoji}>🏆</Text>
        <View style={toastStyles.textBlock}>
          <Text style={[toastStyles.title, { color: '#FFD700' }]}>Master Quiz débloqué !</Text>
          <Text style={toastStyles.subtitle}>
            Tu as terminé toutes les leçons {domainLabel} — le test ultime t'attend !
          </Text>
        </View>
        <Pressable onPress={onDismiss} style={toastStyles.closeBtn}>
          <Icon name="x" size={14} color="#8B949E" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2128',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  trophyEmoji: {
    fontSize: 28,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PATH VIEW
// ─────────────────────────────────────────────────────────────────────────────
function LessonPath({
  nodes,
  accentColor,
  onPress,
}: {
  nodes: LessonNode[];
  accentColor: string;
  onPress: (node: LessonNode) => void;
}) {
  const totalHeight = nodes.length * VERTICAL_GAP + NODE_SIZE + 48;

  const diffColor = (d: string) =>
    d === 'BEGINNER' ? '#39FF14' : d === 'INTERMEDIATE' ? '#FFD700' : '#F85149';

  const nodeColor = (node: LessonNode) => {
    if (node.status === 'completed') return '#238636';
    if (node.status === 'in_progress') return accentColor;
    if (node.status === 'available') return accentColor;
    return '#21262D';
  };

  const nodeBorder = (node: LessonNode) => {
    if (node.status === 'locked') return '#30363D';
    return nodeColor(node);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ height: totalHeight, position: 'relative' }}
    >
      {/* Connecting lines */}
      {nodes.map((node, i) => {
        if (i === nodes.length - 1) return null;
        const x1 = nodeCX(i), y1 = nodeCY(i);
        const x2 = nodeCX(i + 1), y2 = nodeCY(i + 1);
        const dx = x2 - x1, dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const isActive = node.status === 'completed';
        return (
          <View
            key={`line-${i}`}
            style={{
              position: 'absolute',
              left: mx - length / 2,
              top: my - 3,
              width: length,
              height: 6,
              borderRadius: 3,
              backgroundColor: isActive ? accentColor + '60' : '#21262D',
              transform: [{ rotate: `${angle}rad` }],
            }}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node, i) => {
        const isMilestone = (i + 1) % MILESTONE_EVERY === 0;
        const x = nodeX(i);
        const y = nodeY(i);
        const color = nodeColor(node);
        const isLocked = node.status === 'locked';

        const isMasterQuiz = !!node.lesson.isMasterQuiz;

        // Master quiz: gold color override
        const masterColor = '#FFD700';
        const nodeColorFinal = isMasterQuiz && node.status !== 'locked' ? masterColor : color;
        const nodeBorderFinal = isMasterQuiz && node.status !== 'locked'
          ? masterColor
          : nodeBorder(node);

        return (
          <Animated.View
            key={node.lesson.id}
            entering={ZoomIn.delay(i * 40).duration(300)}
            style={{ position: 'absolute', left: x, top: y }}
          >
            {/* Master Quiz outer glow ring (pulses when available) */}
            {isMasterQuiz && node.status === 'available' && (
              <Animated.View
                entering={ZoomIn.duration(600)}
                style={[styles.milestoneRing, {
                  borderColor: masterColor + '80',
                  borderWidth: 3,
                  width: NODE_SIZE + 24,
                  height: NODE_SIZE + 24,
                  borderRadius: (NODE_SIZE + 24) / 2,
                  left: -12,
                  top: -12,
                }]}
              />
            )}

            {/* Regular milestone glow ring */}
            {isMilestone && !isMasterQuiz && node.status !== 'locked' && (
              <View style={[styles.milestoneRing, { borderColor: '#FFD700' + '60' }]} />
            )}

            <Pressable
              onPress={() => onPress(node)}
              disabled={isLocked}
              style={[
                styles.pathNode,
                {
                  backgroundColor: isLocked
                    ? '#161B22'
                    : isMasterQuiz
                    ? masterColor + '25'
                    : color + '20',
                  borderColor: nodeBorderFinal,
                  borderWidth: isMasterQuiz && !isLocked ? 2.5 : 1.5,
                  opacity: isLocked ? 0.4 : 1,
                },
                node.status === 'available' && {
                  shadowColor: nodeColorFinal,
                  shadowOpacity: isMasterQuiz ? 0.9 : 0.6,
                  shadowRadius: isMasterQuiz ? 18 : 12,
                  elevation: isMasterQuiz ? 12 : 8,
                },
              ]}
            >
              {node.status === 'completed' ? (
                isMasterQuiz ? (
                  <Text style={{ fontSize: 26 }}>🏆</Text>
                ) : (
                  <Icon name="check" size={28} color="#fff" />
                )
              ) : node.status === 'locked' ? (
                isMasterQuiz ? (
                  <Text style={{ fontSize: 22 }}>🔒</Text>
                ) : (
                  <Icon name="lock" size={22} color="#484F58" />
                )
              ) : isMasterQuiz ? (
                <Text style={{ fontSize: 28 }}>🏆</Text>
              ) : node.status === 'in_progress' ? (
                <Text style={[styles.nodeNumber, { color }]}>{node.index + 1}</Text>
              ) : (
                <Text style={[styles.nodeNumber, { color }]}>{node.index + 1}</Text>
              )}

              {/* In-progress ring */}
              {node.status === 'in_progress' && (
                <View style={[styles.progressRing, { borderColor: color }]}>
                  <View
                    style={{
                      position: 'absolute',
                      top: -3, left: -3, right: -3, bottom: -3,
                      borderRadius: NODE_SIZE / 2 + 3,
                      borderWidth: 3,
                      borderColor: color + '40',
                    }}
                  />
                </View>
              )}
            </Pressable>

            {/* Master badge label */}
            {isMasterQuiz && !isLocked && (
              <View style={styles.masterBadge}>
                <Text style={styles.masterBadgeText}>MASTER</Text>
              </View>
            )}

            {/* Master lock hint */}
            {isMasterQuiz && isLocked && (
              <View style={styles.masterLockHint}>
                <Text style={styles.masterLockHintText}>Termine toutes les leçons</Text>
              </View>
            )}

            {/* XP badge */}
            {!isLocked && !isMasterQuiz && (
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>+{node.lesson.xpReward}</Text>
              </View>
            )}
            {isMasterQuiz && !isLocked && (
              <View style={[styles.xpBadge, { backgroundColor: '#FFD70022', borderColor: '#FFD70066' }]}>
                <Text style={[styles.xpBadgeText, { color: '#FFD700' }]}>+{node.lesson.xpReward} XP</Text>
              </View>
            )}

            {/* Title */}
            <Text
              style={[
                styles.nodeTitle,
                { color: isLocked ? '#484F58' : isMasterQuiz ? '#FFD700' : '#C9D1D9' },
                isMasterQuiz && !isLocked && { fontWeight: '700' },
              ]}
              numberOfLines={2}
            >
              {node.lesson.title}
            </Text>

            {/* Difficulty dot (regular only) */}
            {!isLocked && !isMasterQuiz && (
              <View style={[styles.diffDot, { backgroundColor: diffColor(node.lesson.difficulty) }]} />
            )}

            {/* Milestone crown (regular only) */}
            {isMilestone && node.status !== 'locked' && !isMasterQuiz && (
              <Text style={styles.milestoneIcon}>👑</Text>
            )}
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
// ─── AI Reco Card ─────────────────────────────────────────────────────────────
function AiRecoCard({ lessonId, title, domain, reason, xpReward, isWeak }: {
  lessonId: string; title: string; domain: string;
  reason: string; xpReward: number; isWeak: boolean;
}) {
  const domainColor =
    domain === 'CRYPTO' ? '#39FF14' : domain === 'TRADING' ? '#FF8C00' : '#58A6FF';
  const domainIcon =
    domain === 'CRYPTO' ? '₿' : domain === 'TRADING' ? '📊' : '💰';

  return (
    <Pressable
      style={[aiRecoStyles.card, isWeak && aiRecoStyles.cardWeak]}
      onPress={() => router.push(`/lesson/${lessonId}`)}
    >
      <View style={aiRecoStyles.left}>
        <View style={[aiRecoStyles.domainBadge, { backgroundColor: domainColor + '20' }]}>
          <Text style={[aiRecoStyles.domainBadgeText, { color: domainColor }]}>
            {domainIcon} {domain}
          </Text>
        </View>
        <Text style={aiRecoStyles.title} numberOfLines={2}>{title}</Text>
        <Text style={aiRecoStyles.reason} numberOfLines={1}>🤖 {reason}</Text>
      </View>
      <View style={aiRecoStyles.right}>
        <Text style={aiRecoStyles.xp}>+{xpReward}</Text>
        <Text style={aiRecoStyles.xpLabel}>XP</Text>
        {isWeak && <Text style={aiRecoStyles.weakBadge}>⚠️ weak</Text>}
      </View>
    </Pressable>
  );
}

const aiRecoStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 220,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  cardWeak: { borderColor: '#FFD70040' },
  left: { flex: 1, gap: 6 },
  domainBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  domainBadgeText: { fontSize: 11, fontWeight: '700' },
  title: { color: '#E6EDF3', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  reason: { color: '#8B949E', fontSize: 11 },
  right: { alignItems: 'center', gap: 2, minWidth: 40 },
  xp: { color: '#39FF14', fontSize: 16, fontWeight: '800' },
  xpLabel: { color: '#8B949E', fontSize: 11 },
  weakBadge: { fontSize: 10, marginTop: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
/** AsyncStorage keys for master quiz unlock toast "seen" state */
const MASTER_QUIZ_SEEN_KEY = (domain: string) =>
  `@mindy/master_quiz_unlock_seen_${domain.toLowerCase()}`;

export default function LearnScreen() {
  const { userId, isLoading: isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain>('CRYPTO');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('path');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgressWithLesson[]>([]);
  const [masterQuizToastDomain, setMasterQuizToastDomain] = useState<string | null>(null);
  const [comboCount, setComboCount] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1.0);

  useEffect(() => {
    if (!isUserLoading && !userId) router.replace('/login');
  }, [isUserLoading, userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [lessonsRes, progressRes, adminFlag, comboRes] = await Promise.all([
        lessonsApi.getAll(),
        progressApi.getByUser(userId).catch(() => ({ success: true, data: [] })),
        AsyncStorage.getItem('@mindy/admin_mode'),
        progressApi.getCurrentCombo(userId).catch(() => null),
      ]);
      if (lessonsRes.success && lessonsRes.data) setLessons(lessonsRes.data);
      if (progressRes.success && progressRes.data) setUserProgress(progressRes.data);
      setIsAdminMode(adminFlag === 'true');
      if (comboRes?.success && comboRes.data?.active) {
        setComboCount(comboRes.data.comboCount);
        setComboMultiplier(comboRes.data.comboMultiplier);
      } else {
        setComboCount(0);
        setComboMultiplier(1.0);
      }
    } catch (err) {
      console.error('Error loading learn data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const getDomainNodes = useCallback((domain: Domain): LessonNode[] => {
    const domainLessons = lessons
      .filter(l => l.domain === domain)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    // Count how many regular (non-master) lessons exist and are completed in this domain
    const regularLessons = domainLessons.filter(l => !l.isMasterQuiz);
    const allRegularCompleted =
      regularLessons.length > 0 &&
      regularLessons.every(l => {
        const prog = userProgress.find(p => p.lessonId === l.id);
        return prog?.isCompleted;
      });

    return domainLessons.map((lesson, index) => {
      const prog = userProgress.find(p => p.lessonId === lesson.id);
      const total = lesson.content.steps.length;
      const done = prog?.completedSteps.length || 0;

      let status: LessonNode['status'];
      if (isAdminMode) {
        // Admin mode: tout déverrouillé
        if (prog?.isCompleted) status = 'completed';
        else if (prog && done > 0) status = 'in_progress';
        else status = 'available';
      } else if (lesson.isMasterQuiz) {
        // Master quiz: locked until ALL regular lessons are completed
        if (prog?.isCompleted) status = 'completed';
        else if (allRegularCompleted) status = 'available';
        else status = 'locked';
      } else {
        status = 'locked';
        if (prog?.isCompleted) status = 'completed';
        else if (prog && done > 0) status = 'in_progress';
        else if (index === 0) status = 'available';
        else {
          // Find previous non-master lesson
          const prevLesson = domainLessons
            .slice(0, index)
            .reverse()
            .find(l => !l.isMasterQuiz);
          if (prevLesson) {
            const prevProg = userProgress.find(p => p.lessonId === prevLesson.id);
            if (prevProg?.isCompleted) status = 'available';
          }
        }
      }

      return { lesson, status, progress: total > 0 ? (done / total) * 100 : 0, index };
    });
  }, [lessons, userProgress, isAdminMode]);

  const getFilteredNodes = useCallback((nodes: LessonNode[]): LessonNode[] => {
    let filtered = nodes;
    if (difficultyFilter !== 'ALL') filtered = filtered.filter(n => n.lesson.difficulty === difficultyFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n => n.lesson.title.toLowerCase().includes(q));
    }
    return filtered;
  }, [difficultyFilter, searchQuery]);

  const cryptoNodes = getDomainNodes('CRYPTO');
  const financeNodes = getDomainNodes('FINANCE');
  const tradingNodes = getDomainNodes('TRADING');

  // ── Master Quiz unlock toast ───────────────────────────────────────────────
  // Check if the selected domain's master quiz just became available for the first time
  useEffect(() => {
    if (isLoading || !userId) return;

    const nodesForDomain = selectedDomain === 'CRYPTO' ? cryptoNodes
      : selectedDomain === 'TRADING' ? tradingNodes
      : financeNodes;

    const hasMasterQuizAvailable = nodesForDomain.some(
      n => n.lesson.isMasterQuiz && n.status === 'available',
    );

    if (!hasMasterQuizAvailable) return;

    const seenKey = MASTER_QUIZ_SEEN_KEY(selectedDomain);
    AsyncStorage.getItem(seenKey).then((seen) => {
      if (!seen) {
        // First time — show the toast and mark as seen
        AsyncStorage.setItem(seenKey, '1').catch(() => {});
        setMasterQuizToastDomain(selectedDomain);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    });
  }, [isLoading, userId, selectedDomain, cryptoNodes, financeNodes, tradingNodes]);

  const rawNodes =
    selectedDomain === 'CRYPTO' ? cryptoNodes
    : selectedDomain === 'TRADING' ? tradingNodes
    : financeNodes;
  const filteredNodes = getFilteredNodes(rawNodes);

  const completedCount = rawNodes.filter(n => n.status === 'completed').length;
  const accentColor =
    selectedDomain === 'CRYPTO' ? '#39FF14'
    : selectedDomain === 'TRADING' ? '#FF8C00'
    : '#58A6FF';

  const handleDomainChange = async (domain: Domain) => {
    if (domain === selectedDomain) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDomain(domain);
    setSearchQuery('');
    setDifficultyFilter('ALL');
  };

  const handleViewToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode(v => v === 'path' ? 'list' : 'path');
  };

  const handleLessonPress = async (node: LessonNode) => {
    if (node.status === 'locked') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/lesson/${node.lesson.id}`);
  };

  const difficultyColor = (d: string) =>
    d === 'BEGINNER' ? '#39FF14' : d === 'INTERMEDIATE' ? '#FFD700' : '#F85149';

  if (isUserLoading || isLoading || !userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 20, gap: 16 }}>
          <SkeletonBox height={28} width="50%" borderRadius={8} />
          <SkeletonBox height={52} borderRadius={12} />
          {[0, 1, 2, 3, 4].map(i => (
            <SkeletonBox key={i} height={72} borderRadius={12} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Master Quiz Unlock Toast */}
      <MasterQuizUnlockToast
        domain={masterQuizToastDomain ?? selectedDomain}
        visible={!!masterQuizToastDomain}
        onDismiss={() => setMasterQuizToastDomain(null)}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Apprendre</Text>
          <Text style={styles.headerSub}>
            {completedCount}/{rawNodes.length} complétées
          </Text>
        </View>
        <Pressable
          style={[styles.viewToggle, { borderColor: accentColor + '60' }]}
          onPress={handleViewToggle}
        >
          <Icon
            name={viewMode === 'path' ? 'menu' : 'chart'}
            size={18}
            color={accentColor}
          />
          <Text style={[styles.viewToggleText, { color: accentColor }]}>
            {viewMode === 'path' ? 'Liste' : 'Parcours'}
          </Text>
        </Pressable>
      </View>



      {/* Active Combo Indicator */}
      {comboCount >= 3 && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.comboBanner}
        >
          <LinearGradient
            colors={comboMultiplier >= 2.0
              ? ['rgba(255,215,0,0.18)', 'rgba(255,140,0,0.08)']
              : ['rgba(57,255,20,0.15)', 'rgba(57,255,20,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.comboEmoji}>{comboMultiplier >= 2.0 ? '🔥' : '⚡'}</Text>
          <Text style={[
            styles.comboText,
            { color: comboMultiplier >= 2.0 ? '#FFD700' : '#39FF14' }
          ]}>
            COMBO ×{comboMultiplier.toFixed(1)} — {comboCount} leçons consécutives !
          </Text>
        </Animated.View>
      )}

      {/* Domain Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, selectedDomain === 'CRYPTO' && styles.tabActiveCrypto]}
          onPress={() => handleDomainChange('CRYPTO')}
        >
          <Text style={[styles.tabText, selectedDomain === 'CRYPTO' && styles.tabTextActiveCrypto]}>
            ₿ Crypto
          </Text>
          <Text style={[styles.tabCount, selectedDomain === 'CRYPTO' && { color: '#39FF14' }]}>
            {cryptoNodes.length}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedDomain === 'TRADING' && styles.tabActiveTrading]}
          onPress={() => handleDomainChange('TRADING')}
        >
          <Text style={[styles.tabText, selectedDomain === 'TRADING' && styles.tabTextActiveTrading]}>
            📊 Trading
          </Text>
          <Text style={[styles.tabCount, selectedDomain === 'TRADING' && { color: '#FF8C00' }]}>
            {tradingNodes.length}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedDomain === 'FINANCE' && styles.tabActiveFinance]}
          onPress={() => handleDomainChange('FINANCE')}
        >
          <Text style={[styles.tabText, selectedDomain === 'FINANCE' && styles.tabTextActiveFinance]}>
            💰 Finance
          </Text>
          <Text style={[styles.tabCount, selectedDomain === 'FINANCE' && { color: '#58A6FF' }]}>
            {financeNodes.length}
          </Text>
        </Pressable>
      </View>

      {/* Admin Mode Banner */}
      {isAdminMode && (
        <Pressable
          style={styles.adminBanner}
          onPress={async () => {
            await AsyncStorage.removeItem('@mindy/admin_mode');
            setIsAdminMode(false);
          }}
        >
          <Text style={styles.adminBannerText}>🛠 Admin Mode — toutes les leçons déverrouillées</Text>
          <Text style={styles.adminBannerClose}>✕</Text>
        </Pressable>
      )}

      {/* PATH VIEW */}
      {viewMode === 'path' && (
        <LessonPath
          nodes={filteredNodes}
          accentColor={accentColor}
          onPress={handleLessonPress}
        />
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={16} color="#8B949E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une leçon..."
              placeholderTextColor="#484F58"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Icon name="x" size={14} color="#8B949E" />
              </Pressable>
            )}
          </View>

          {/* Difficulty Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}
          >
            {DIFFICULTY_FILTERS.map(f => (
              <Pressable
                key={f.value}
                style={[
                  styles.filterChip,
                  difficultyFilter === f.value && { backgroundColor: accentColor + '20', borderColor: accentColor },
                ]}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDifficultyFilter(f.value);
                }}
              >
                <Text style={[styles.filterChipText, difficultyFilter === f.value && { color: accentColor }]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredNodes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>Aucune leçon trouvée</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Essaie un autre filtre'}
                </Text>
              </View>
            ) : (
              filteredNodes.map((node, idx) => (
                <Animated.View
                  key={node.lesson.id}
                  entering={FadeInDown.delay(idx * 50).duration(250)}
                >
                  <Pressable
                    style={[
                      styles.card,
                      (node.status === 'available' || node.status === 'in_progress') && { borderLeftColor: accentColor },
                      node.status === 'completed' && styles.cardCompleted,
                      node.status === 'locked' && styles.cardLocked,
                    ]}
                    onPress={() => handleLessonPress(node)}
                    disabled={node.status === 'locked'}
                  >
                    <View style={[
                      styles.statusBadge,
                      node.status === 'completed' && styles.statusBadgeCompleted,
                      node.status === 'locked' && styles.statusBadgeLocked,
                      (node.status === 'available' || node.status === 'in_progress') && {
                        backgroundColor: accentColor + '20', borderColor: accentColor,
                      },
                    ]}>
                      {node.status === 'completed' ? (
                        <Icon name="check" size={16} color="#fff" />
                      ) : node.status === 'locked' ? (
                        <Icon name="lock" size={14} color="#484F58" />
                      ) : (
                        <Text style={[styles.statusNumber, { color: accentColor }]}>{node.index + 1}</Text>
                      )}
                    </View>

                    <View style={styles.cardContent}>
                      <Text
                        style={[styles.cardTitle, node.status === 'locked' && styles.cardTitleLocked]}
                        numberOfLines={1}
                      >
                        {node.lesson.title}
                      </Text>
                      <View style={styles.cardMeta}>
                        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor(node.lesson.difficulty) + '20' }]}>
                          <Text style={[styles.difficultyText, { color: difficultyColor(node.lesson.difficulty) }]}>
                            {node.lesson.difficulty === 'BEGINNER' ? 'Débutant'
                              : node.lesson.difficulty === 'INTERMEDIATE' ? 'Intermédiaire' : 'Avancé'}
                          </Text>
                        </View>
                        <Text style={styles.cardMetaDot}>•</Text>
                        <Text style={styles.cardMetaText}>{node.lesson.content.steps.length} étapes</Text>
                        <Text style={styles.cardMetaDot}>•</Text>
                        <Text style={styles.cardXp}>+{node.lesson.xpReward} XP</Text>
                      </View>
                      {node.status === 'in_progress' && (
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${node.progress}%`, backgroundColor: accentColor }]} />
                        </View>
                      )}
                    </View>

                    {node.status === 'completed' ? (
                      <Pressable
                        style={[styles.practiceBtn, { borderColor: accentColor + '60' }]}
                        onPress={async () => {
                          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(`/lesson/${node.lesson.id}?practice=true`);
                        }}
                      >
                        <Icon name="refresh" size={14} color={accentColor} />
                        <Text style={[styles.practiceBtnText, { color: accentColor }]}>Pratiquer</Text>
                      </Pressable>
                    ) : node.status !== 'locked' ? (
                      <Icon name="chevron-right" size={20} color={accentColor} />
                    ) : null}
                  </Pressable>
                </Animated.View>
              ))
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#E6EDF3', fontFamily: 'Inter' },
  headerSub: { fontSize: 13, color: '#8B949E', fontFamily: 'JetBrainsMono', marginTop: 2 },
  viewToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  viewToggleText: { fontSize: 12, fontWeight: '700', fontFamily: 'JetBrainsMono' },
  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#161B22', borderRadius: 12, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  tabActiveCrypto: { backgroundColor: 'rgba(57,255,20,0.12)' },
  tabActiveFinance: { backgroundColor: 'rgba(88,166,255,0.12)' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#8B949E', fontFamily: 'Inter' },
  tabTextActiveCrypto: { color: '#39FF14' },
  tabTextActiveFinance: { color: '#58A6FF' },
  tabTextActiveTrading: { color: '#FF8C00' },
  tabActiveTrading: { backgroundColor: 'rgba(255,140,0,0.12)' },
  tabCount: {
    fontSize: 11, fontWeight: '700', fontFamily: 'JetBrainsMono', color: '#484F58',
    backgroundColor: '#21262D', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },

  // Admin banner
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 140, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.4)',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  adminBannerText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#FF8C00',
    fontWeight: '600',
    flex: 1,
  },
  adminBannerClose: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#FF8C00',
    marginLeft: 8,
  },

  // PATH NODE
  pathNode: {
    width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
    borderWidth: 3, justifyContent: 'center', alignItems: 'center',
  },
  nodeNumber: { fontSize: 20, fontWeight: '800', fontFamily: 'JetBrainsMono' },
  progressRing: {
    position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: NODE_SIZE / 2 + 4, borderWidth: 3, borderStyle: 'dashed',
  },
  milestoneRing: {
    position: 'absolute', top: -10, left: -10,
    width: NODE_SIZE + 20, height: NODE_SIZE + 20,
    borderRadius: (NODE_SIZE + 20) / 2, borderWidth: 2,
  },
  xpBadge: {
    position: 'absolute', top: -8, right: -16,
    backgroundColor: '#FFD700', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
  },
  xpBadgeText: { fontSize: 9, fontWeight: '800', color: '#0D1117', fontFamily: 'JetBrainsMono' },
  nodeTitle: {
    position: 'absolute', top: NODE_SIZE + 8, left: -20, width: NODE_SIZE + 40,
    fontSize: 11, textAlign: 'center', fontFamily: 'Inter', lineHeight: 15,
  },
  diffDot: {
    position: 'absolute', bottom: -6, left: NODE_SIZE / 2 - 4,
    width: 8, height: 8, borderRadius: 4,
  },
  milestoneIcon: {
    position: 'absolute', top: -26, left: NODE_SIZE / 2 - 10, fontSize: 20,
  },
  masterBadge: {
    position: 'absolute',
    top: -22,
    left: NODE_SIZE / 2 - 28,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  masterBadgeText: {
    color: '#0D1117',
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'JetBrainsMono',
    letterSpacing: 1,
  },
  masterLockHint: {
    position: 'absolute',
    top: NODE_SIZE + 44,
    left: -30,
    width: NODE_SIZE + 60,
  },
  masterLockHintText: {
    color: '#484F58',
    fontSize: 9,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontStyle: 'italic',
  },

  // LIST VIEW
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#161B22', borderRadius: 12, borderWidth: 1, borderColor: '#30363D',
    marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#E6EDF3', fontFamily: 'Inter', padding: 0 },
  filtersScroll: { marginBottom: 12, maxHeight: 44 },
  filtersContent: { paddingHorizontal: 20, gap: 8, flexDirection: 'row' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#30363D', backgroundColor: '#161B22',
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#8B949E', fontFamily: 'JetBrainsMono' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#E6EDF3', fontFamily: 'Inter' },
  emptyText: { fontSize: 13, color: '#484F58', fontFamily: 'Inter', textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#161B22',
    borderRadius: 12, padding: 16, gap: 12, borderLeftWidth: 3, borderLeftColor: 'transparent',
    borderWidth: 1, borderColor: '#21262D',
  },
  cardCompleted: { borderLeftColor: '#238636', backgroundColor: 'rgba(35,134,54,0.06)' },
  cardLocked: { opacity: 0.45 },
  statusBadge: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#21262D', borderWidth: 2, borderColor: '#30363D',
  },
  statusBadgeCompleted: { backgroundColor: '#238636', borderColor: '#238636' },
  statusBadgeLocked: { backgroundColor: '#21262D', borderColor: '#30363D' },
  statusNumber: { fontSize: 14, fontWeight: '700', fontFamily: 'JetBrainsMono' },
  cardContent: { flex: 1, gap: 5 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#E6EDF3', fontFamily: 'Inter' },
  cardTitleLocked: { color: '#484F58' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  difficultyBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  difficultyText: { fontSize: 10, fontWeight: '700', fontFamily: 'JetBrainsMono' },
  cardMetaText: { fontSize: 12, color: '#8B949E', fontFamily: 'Inter' },
  cardMetaDot: { fontSize: 10, color: '#484F58' },
  cardXp: { fontSize: 12, color: '#FFD700', fontWeight: '600', fontFamily: 'JetBrainsMono' },
  progressBar: { height: 4, backgroundColor: '#30363D', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  practiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },
  practiceBtnText: { fontSize: 11, fontWeight: '700', fontFamily: 'JetBrainsMono' },

  // AI Recommendations
  aiSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(57,255,20,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.12)',
    padding: 14,
    gap: 10,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiTitle: { color: '#E6EDF3', fontSize: 14, fontWeight: '700' },
  aiSub: { color: '#8B949E', fontSize: 12 },
  aiMessage: { color: '#8B949E', fontSize: 12, fontStyle: 'italic', marginTop: 4 },

  // ── Combo Banner ────────────────────────────────────────────────────────
  comboBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.25)',
  },
  comboEmoji: {
    fontSize: 18,
  },
  comboText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
