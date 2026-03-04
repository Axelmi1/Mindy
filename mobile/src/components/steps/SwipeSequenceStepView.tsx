import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, LayoutAnimation, Platform, UIManager } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  FadeInDown,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { SwipeSequenceStep, SwipeCard } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const CARD_WIDTH = SCREEN_WIDTH - 80;

interface SwipeSequenceStepViewProps {
  step: SwipeSequenceStep;
  onComplete: (isCorrect: boolean) => void;
}

type GameState = 'playing' | 'finished';
type MindyMood = 'neutral' | 'hype' | 'roast' | 'thinking';

/**
 * SwipeSequenceStepView - Rapid fire swipe cards (Trading Swipe)
 */
export function SwipeSequenceStepView({ step, onComplete }: SwipeSequenceStepViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [mindyMood, setMindyMood] = useState<MindyMood>('neutral');
  const [timeLeft, setTimeLeft] = useState(step.timeLimit || 0);

  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  const currentCard = step.cards[currentIndex];
  const totalCards = step.cards.length;
  const progress = currentIndex / totalCards;

  // Timer effect
  useEffect(() => {
    if (!step.timeLimit || gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('finished');
          return 0;
        }
        // Update Mindy mood when time is low
        if (prev <= 5) {
          setMindyMood('thinking');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step.timeLimit, gameState]);

  // Update Mindy mood based on streak
  useEffect(() => {
    if (streak >= 3) {
      setMindyMood('hype');
    } else if (streak === 0 && currentIndex > 0) {
      setMindyMood('roast');
    }
  }, [streak, currentIndex]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!currentCard || gameState !== 'playing') return;

    const isCorrect = currentCard.correctDirection === direction;

    if (isCorrect) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStreak(0);
    }

    // Spring animation config
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

    // Move to next card or finish
    if (currentIndex >= totalCards - 1) {
      setGameState('finished');
      setTimeout(() => {
        onComplete(score + (isCorrect ? 1 : 0) >= Math.ceil(totalCards * 0.7));
      }, 1500);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentCard, currentIndex, totalCards, score, gameState, onComplete]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (gameState !== 'playing') return;
      translateX.value = e.translationX;
      rotate.value = e.translationX / 20;
      scale.value = 1 - Math.abs(e.translationX) / SCREEN_WIDTH * 0.1;
    })
    .onEnd((e) => {
      if (gameState !== 'playing') return;

      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 });
        runOnJS(handleSwipe)('right');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        runOnJS(handleSwipe)('left');
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
        scale.value = withSpring(1);
      }
    });

  // Reset card position when index changes
  useEffect(() => {
    translateX.value = 0;
    rotate.value = 0;
    scale.value = 1;
  }, [currentIndex]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -30 ? Math.min(1, Math.abs(translateX.value) / 100) : 0,
    transform: [{ scale: translateX.value < -30 ? 1 + Math.abs(translateX.value) / 500 : 1 }],
  }));

  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 30 ? Math.min(1, translateX.value / 100) : 0,
    transform: [{ scale: translateX.value > 30 ? 1 + translateX.value / 500 : 1 }],
  }));

  // Game finished
  if (gameState === 'finished') {
    const percentage = Math.round((score / totalCards) * 100);
    const passed = percentage >= 70;

    return (
      <View style={styles.container}>
        <Animated.View entering={ZoomIn.duration(400)}>
          <View style={[styles.resultCard, passed ? styles.resultPass : styles.resultFail]}>
            <View style={styles.resultIconContainer}>
              <Icon name={passed ? 'target' : 'alert'} size={48} color={passed ? '#39FF14' : '#F85149'} />
            </View>
            <Text style={styles.resultTitle}>{passed ? 'Nice Trading!' : 'Keep Practicing!'}</Text>
            <Text style={styles.resultScore}>{score}/{totalCards}</Text>
            <Text style={styles.resultPercentage}>{percentage}% Accuracy</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          <MindyMessage
            message={passed
              ? "Sharp instincts! You've got the eye of a trader."
              : "Markets are tough. Let's run it back and level up."
            }
            mood={passed ? 'hype' : 'roast'}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mindy Message */}
      {step.mindyMessage && currentIndex === 0 && (
        <Animated.View entering={FadeIn.duration(300)}>
          <MindyMessage message={step.mindyMessage} mood={mindyMood} />
        </Animated.View>
      )}

      {/* Title & Instructions */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.instruction}>{step.instruction}</Text>
      </Animated.View>

      {/* Timer (if applicable) */}
      {step.timeLimit && (
        <View style={styles.timerContainer}>
          <Text style={[styles.timer, timeLeft <= 5 && styles.timerWarning]}>
            ⏱ {timeLeft}s
          </Text>
        </View>
      )}

      {/* Progress & Score */}
      <View style={styles.statsRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.scoreContainer}>
          <View style={styles.scoreItem}>
            <Icon name="target" size={16} color="#39FF14" />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
          {streak >= 2 && (
            <Animated.View entering={ZoomIn} style={styles.scoreItem}>
              <Icon name="flame" size={16} color="#FF6B35" />
              <Text style={styles.streakText}>{streak}</Text>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Permanent Labels - Always visible */}
      <View style={styles.labelsRow}>
        <View style={[styles.label, styles.labelLeft]}>
          <Icon name="chevron-left" size={20} color="#F85149" />
          <Text style={[styles.labelText, styles.labelTextLeft]}>{step.leftLabel}</Text>
        </View>
        <View style={[styles.label, styles.labelRight]}>
          <Text style={[styles.labelText, styles.labelTextRight]}>{step.rightLabel}</Text>
          <Icon name="chevron-right" size={20} color="#39FF14" />
        </View>
      </View>

      {/* Swipe Direction Indicators (appear when swiping) */}
      <View style={styles.swipeIndicators}>
        <Animated.View style={[styles.swipeIndicator, styles.swipeLeft, leftIndicatorStyle]}>
          <Text style={styles.swipeIndicatorText}>{step.leftLabel}</Text>
        </Animated.View>
        <Animated.View style={[styles.swipeIndicator, styles.swipeRight, rightIndicatorStyle]}>
          <Text style={styles.swipeIndicatorText}>{step.rightLabel}</Text>
        </Animated.View>
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        {/* Next card preview (behind) */}
        {currentIndex < totalCards - 1 && (
          <View style={[styles.card, styles.cardPreview]}>
            <Text style={styles.cardContent}>{step.cards[currentIndex + 1].content}</Text>
          </View>
        )}

        {/* Current card */}
        {currentCard && (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.card, cardStyle]}>
              <Text style={styles.cardContent}>{currentCard.content}</Text>
              <Text style={styles.cardCounter}>{currentIndex + 1}/{totalCards}</Text>
            </Animated.View>
          </GestureDetector>
        )}
      </View>

      {/* Swipe instruction */}
      <View style={styles.hintsRow}>
        <Text style={styles.hintText}>Swipe the card left or right</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  instruction: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timer: {
    fontFamily: 'JetBrainsMono',
    fontSize: 18,
    fontWeight: '700',
    color: '#58A6FF',
  },
  timerWarning: {
    color: '#F85149',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#30363D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#39FF14',
    borderRadius: 3,
  },
  scoreContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#E6EDF3',
  },
  streakText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#F78166',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  labelLeft: {
    backgroundColor: 'rgba(248, 81, 73, 0.3)',
    borderWidth: 2,
    borderColor: '#F85149',
  },
  labelRight: {
    backgroundColor: 'rgba(57, 255, 20, 0.3)',
    borderWidth: 2,
    borderColor: '#39FF14',
  },
  labelIcon: {
    fontSize: 20,
  },
  labelText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
  },
  labelTextLeft: {
    color: '#F85149',
  },
  labelTextRight: {
    color: '#39FF14',
  },
  swipeIndicators: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  swipeIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  swipeLeft: {
    backgroundColor: '#F85149',
  },
  swipeRight: {
    backgroundColor: '#39FF14',
  },
  swipeIndicatorText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  cardContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#30363D',
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPreview: {
    transform: [{ scale: 0.95 }],
    opacity: 0.5,
  },
  cardContent: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#E6EDF3',
    textAlign: 'center',
    lineHeight: 26,
  },
  cardCounter: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#484F58',
  },
  hintsRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  hintText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8B949E',
  },
  resultCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
  },
  resultPass: {
    borderColor: '#39FF14',
  },
  resultFail: {
    borderColor: '#F78166',
  },
  resultEmoji: {
    fontSize: 48,
  },
  resultIconContainer: {
    marginBottom: 8,
  },
  resultTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  resultScore: {
    fontFamily: 'JetBrainsMono',
    fontSize: 32,
    fontWeight: '700',
    color: '#39FF14',
  },
  resultPercentage: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#8B949E',
  },
});
