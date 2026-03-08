import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { SpeedRoundStep } from '@mindy/shared';
import { Icon } from '../ui/Icon';

interface SpeedRoundStepViewProps {
  step: SpeedRoundStep;
  onComplete: (isCorrect: boolean) => void;
}

export function SpeedRoundStepView({ step, onComplete }: SpeedRoundStepViewProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(step.timeLimitSeconds);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [cardKey, setCardKey] = useState(0);

  const progressWidth = useSharedValue(1);

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      setPhase('done');
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft(t => t - 1);
      progressWidth.value = withTiming((timeLeft - 1) / step.timeLimitSeconds, { duration: 1000 });
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, phase]);

  const timerBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const getMultiplier = (streak: number): number => {
    if (streak >= 6) return 3;
    if (streak >= 3) return 2;
    return 1;
  };

  const handleAnswer = useCallback(async (userAnswer: boolean) => {
    if (phase !== 'playing') return;
    const pair = step.pairs[currentIdx];
    const correct = userAnswer === pair.isTrue;

    if (correct) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newStreak = consecutiveCorrect + 1;
      setConsecutiveCorrect(newStreak);
      setScore(s => s + getMultiplier(newStreak));
      setTotalCorrect(t => t + 1);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setConsecutiveCorrect(0);
    }

    const nextIdx = currentIdx + 1;
    if (nextIdx >= step.pairs.length) {
      setPhase('done');
    } else {
      setCurrentIdx(nextIdx);
      setCardKey(k => k + 1);
    }
  }, [phase, currentIdx, consecutiveCorrect, step.pairs]);

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('playing');
  };

  const handleContinue = () => {
    const passThreshold = Math.ceil(step.pairs.length * 0.6);
    onComplete(totalCorrect >= passThreshold);
  };

  const multiplier = getMultiplier(consecutiveCorrect);

  // Ready screen
  if (phase === 'ready') {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.readyCard}>
          <Icon name="zap" size={36} color="#FFD700" />
          <Text style={styles.readyTitle}>{step.title}</Text>
          <Text style={styles.readySubtitle}>
            {step.pairs.length} questions en {step.timeLimitSeconds}s
          </Text>
          <Text style={styles.readyHint}>
            Combo x2 a 3 bonnes, x3 a 6 !
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(200)}>
          <Pressable style={styles.startButton} onPress={handleStart}>
            <Icon name="play" size={20} color="#0D1117" />
            <Text style={styles.startButtonText}>GO !</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Playing screen
  if (phase === 'playing') {
    const pair = step.pairs[currentIdx];
    return (
      <View style={styles.container}>
        {/* Timer bar */}
        <View style={styles.timerBarBg}>
          <Animated.View style={[
            styles.timerBarFill,
            timerBarStyle,
            { backgroundColor: timeLeft <= 5 ? '#F85149' : '#39FF14' },
          ]} />
        </View>

        {/* Score + multiplier row */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.progressText}>{currentIdx + 1}/{step.pairs.length}</Text>
          {multiplier > 1 && (
            <Animated.View entering={ZoomIn.duration(200)} style={[
              styles.multiplierBadge,
              multiplier === 3 && styles.multiplierX3,
            ]}>
              <Text style={styles.multiplierText}>x{multiplier}</Text>
            </Animated.View>
          )}
        </View>

        {/* Statement card */}
        <Animated.View
          key={cardKey}
          entering={SlideInRight.duration(200)}
          style={styles.statementCard}
        >
          <Text style={styles.statementText}>{pair.statement}</Text>
        </Animated.View>

        {/* True/False buttons */}
        <View style={styles.answerRow}>
          <Pressable
            style={[styles.answerButton, styles.trueButton]}
            onPress={() => handleAnswer(true)}
          >
            <Icon name="check" size={28} color="#39FF14" />
            <Text style={[styles.answerLabel, { color: '#39FF14' }]}>VRAI</Text>
          </Pressable>
          <Pressable
            style={[styles.answerButton, styles.falseButton]}
            onPress={() => handleAnswer(false)}
          >
            <Icon name="x" size={28} color="#F85149" />
            <Text style={[styles.answerLabel, { color: '#F85149' }]}>FAUX</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Done screen
  const accuracy = step.pairs.length > 0
    ? Math.round((totalCorrect / step.pairs.length) * 100)
    : 0;
  const passed = totalCorrect >= Math.ceil(step.pairs.length * 0.6);

  return (
    <View style={styles.container}>
      <Animated.View entering={ZoomIn.duration(300)} style={styles.doneCard}>
        <Icon name={passed ? 'zap' : 'clock'} size={40} color={passed ? '#FFD700' : '#F85149'} />
        <Text style={[styles.doneTitle, { color: passed ? '#39FF14' : '#F85149' }]}>
          {timeLeft <= 0 ? "Temps écoulé !" : "Terminé !"}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalCorrect}/{step.pairs.length}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Précision</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)}>
        <Pressable
          style={[styles.continueButton, { backgroundColor: passed ? '#39FF14' : '#F85149' }]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
          <Icon name="arrow-right" size={18} color="#0D1117" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  readyCard: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
    backgroundColor: '#161B22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  readyTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: '#E6EDF3',
    textAlign: 'center',
  },
  readySubtitle: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    color: '#8B949E',
  },
  readyHint: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#FFD700',
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#39FF14',
    paddingVertical: 18,
    borderRadius: 14,
  },
  startButtonText: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1117',
  },
  timerBarBg: {
    height: 6,
    backgroundColor: '#21262D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  progressText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8B949E',
  },
  multiplierBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  multiplierX3: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  multiplierText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  statementCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#30363D',
    minHeight: 120,
    justifyContent: 'center',
  },
  statementText: {
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '600',
    color: '#E6EDF3',
    textAlign: 'center',
    lineHeight: 26,
  },
  answerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  answerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  trueButton: {
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  falseButton: {
    backgroundColor: 'rgba(248, 81, 73, 0.08)',
    borderColor: 'rgba(248, 81, 73, 0.4)',
  },
  answerLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
  },
  doneCard: {
    alignItems: 'center',
    gap: 16,
    padding: 28,
    backgroundColor: '#161B22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  doneTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 20,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  statLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  continueButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
});
