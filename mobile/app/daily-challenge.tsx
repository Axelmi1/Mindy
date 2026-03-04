import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { dailyChallengeApi, DailyChallenge } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/hooks/useSound';
import { MindyMessage } from '@/components/MindyMessage';
import { Icon } from '@/components/ui/Icon';
import { Confetti, XpCounter } from '@/components/animations';

type ScreenState = 'loading' | 'ready' | 'completed' | 'already_done' | 'error';

/**
 * Daily Challenge Screen
 * Special daily quiz with bonus XP
 */
export default function DailyChallengeScreen() {
  const { userId, isLoading: isUserLoading } = useUser();
  const { play: playSound } = useSound();

  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Format time until reset
  const formatTimeUntilReset = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Load daily challenge
  useEffect(() => {
    if (!userId || isUserLoading) return;

    const loadChallenge = async () => {
      try {
        setScreenState('loading');
        const res = await dailyChallengeApi.getToday(userId);

        if (res.success && res.data) {
          setChallenge(res.data);
          setTimeUntilReset(formatTimeUntilReset(res.data.timeUntilReset));

          if (res.data.isCompleted) {
            setScreenState('already_done');
          } else {
            setScreenState('ready');
          }
        } else {
          setScreenState('error');
        }
      } catch (err) {
        console.error('Error loading daily challenge:', err);
        setScreenState('error');
      }
    };

    loadChallenge();
  }, [userId, isUserLoading]);

  // Start the challenge lesson
  const handleStartChallenge = useCallback(() => {
    if (challenge) {
      router.push(`/lesson/${challenge.lessonId}`);
    }
  }, [challenge]);

  // Complete the challenge
  const handleCompleteChallenge = useCallback(async () => {
    if (!userId || !challenge) return;

    try {
      const res = await dailyChallengeApi.complete(userId);

      if (res.success && res.data) {
        setXpAwarded(res.data.xpAwarded);
        playSound('complete');
        setShowConfetti(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScreenState('completed');
      }
    } catch (err) {
      console.error('Error completing challenge:', err);
    }
  }, [userId, challenge, playSound]);

  // Loading state
  if (isUserLoading || screenState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading daily challenge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (screenState === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#8B949E" />
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <MindyMessage
            message="Oops! Couldn't load today's challenge. Try again later!"
            mood="roast"
          />
          <Pressable style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Already completed state
  if (screenState === 'already_done') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#8B949E" />
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <Animated.View entering={FadeIn.duration(400)}>
            <MindyMessage
              message="You already crushed today's challenge! Come back tomorrow for more bonus XP."
              mood="hype"
            />
          </Animated.View>

          <Animated.View style={styles.completedCard} entering={FadeInUp.delay(200)}>
            <Icon name="check" size={48} color="#39FF14" />
            <Text style={styles.completedTitle}>Challenge Complete!</Text>
            <Text style={styles.resetText}>Next challenge in: {timeUntilReset}</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // Completed state (just finished)
  if (screenState === 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        {showConfetti && <Confetti count={80} onComplete={() => setShowConfetti(false)} />}

        <View style={styles.centerContent}>
          <Animated.View entering={FadeIn.duration(400)}>
            <MindyMessage
              message="Daily challenge CRUSHED! That's some serious dedication right there."
              mood="hype"
            />
          </Animated.View>

          <Animated.View style={styles.rewardCard} entering={ZoomIn.delay(300)}>
            <Icon name="trophy" size={48} color="#FFD700" />
            <Text style={styles.rewardTitle}>Bonus XP Earned!</Text>
            <XpCounter value={xpAwarded} showPlus size="large" />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600)}>
            <Pressable style={styles.doneButton} onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>Back to Dashboard</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // Ready state
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#8B949E" />
        </Pressable>
        <View style={styles.timerBadge}>
          <Icon name="clock" size={14} color="#FFD700" />
          <Text style={styles.timerText}>{timeUntilReset}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(400)}>
          <MindyMessage
            message="Today's challenge awaits! Complete it for bonus XP."
            mood="thinking"
          />
        </Animated.View>

        <Animated.View style={styles.challengeCard} entering={FadeInUp.delay(200)}>
          <View style={styles.challengeBadge}>
            <Icon name="target" size={18} color="#FFD700" />
            <Text style={styles.challengeBadgeText}>DAILY CHALLENGE</Text>
          </View>

          <Text style={styles.challengeTitle}>{challenge?.lesson.title}</Text>

          <View style={styles.challengeMeta}>
            <View style={[styles.domainBadge, {
              backgroundColor: challenge?.lesson.domain === 'CRYPTO' ? 'rgba(57, 255, 20, 0.2)' : 'rgba(88, 166, 255, 0.2)'
            }]}>
              <Text style={[styles.domainText, {
                color: challenge?.lesson.domain === 'CRYPTO' ? '#39FF14' : '#58A6FF'
              }]}>
                {challenge?.lesson.domain}
              </Text>
            </View>
            <Text style={styles.stepsText}>
              {challenge?.lesson.content.steps.length} steps
            </Text>
          </View>

          <View style={styles.bonusContainer}>
            <Text style={styles.bonusLabel}>BONUS REWARD</Text>
            <View style={styles.bonusRow}>
              <Icon name="zap" size={20} color="#FFD700" />
              <Text style={styles.bonusAmount}>+{challenge?.xpBonus} XP</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)}>
          <Pressable style={styles.startButton} onPress={handleStartChallenge}>
            <Text style={styles.startButtonText}>Start Challenge</Text>
          </Pressable>
        </Animated.View>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#FFD700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 32,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  loadingText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#8B949E',
    marginTop: 12,
  },
  challengeCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    padding: 24,
    gap: 16,
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  challengeBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  challengeTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  domainBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  domainText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
  },
  stepsText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8B949E',
  },
  bonusContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  bonusLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#8B949E',
    letterSpacing: 1,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bonusAmount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
  },
  startButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  completedCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#39FF14',
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  completedTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    color: '#39FF14',
  },
  resetText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8B949E',
  },
  rewardCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  rewardTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  doneButton: {
    backgroundColor: '#39FF14',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  errorButton: {
    backgroundColor: '#30363D',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  errorButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
  },
});
