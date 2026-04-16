import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  BounceIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { WordScrambleStep } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

interface WordScrambleStepViewProps {
  step: WordScrambleStep;
  onAnswer: (isCorrect: boolean) => void;
}

type GameState = 'playing' | 'correct' | 'incorrect';

const TIME_LIMIT = 30;

export function WordScrambleStepView({ step, onAnswer }: WordScrambleStepViewProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerProgress = useSharedValue(1);
  const shakeX = useSharedValue(0);

  // Scrambled letters + decoy letters (auto-generated from consonants/vowels not in the word)
  const letters = useMemo(() => {
    const word = step.word.toUpperCase();
    const decoyPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => !word.includes(l));
    // Add 4-5 random decoy letters
    const decoyCount = Math.min(5, decoyPool.length);
    const shuffled = [...decoyPool].sort(() => Math.random() - 0.5);
    const decoys = shuffled.slice(0, decoyCount);
    // Mix scrambled + decoys
    const all = [...step.scrambled, ...decoys];
    return all.sort(() => Math.random() - 0.5);
  }, [step.scrambled, step.word]);

  // Start timer
  useEffect(() => {
    timerProgress.value = withTiming(0, { duration: TIME_LIMIT * 1000 });

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Time's up
  useEffect(() => {
    if (timeLeft === 0 && gameState === 'playing') {
      handleTimeUp();
    }
  }, [timeLeft, gameState]);

  const handleTimeUp = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    setGameState('incorrect');
  };

  const handleLetterPress = async (index: number) => {
    if (gameState !== 'playing') return;
    if (selectedIndices.includes(index)) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSelected = [...selectedIndices, index];
    setSelectedIndices(newSelected);

    // Check if word is complete
    if (newSelected.length === step.word.length) {
      const formed = newSelected.map((i) => letters[i]).join('');
      if (formed.toUpperCase() === step.word.toUpperCase()) {
        if (timerRef.current) clearInterval(timerRef.current);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setGameState('correct');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeX.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        setGameState('incorrect');
      }
    }
  };

  const handleRemoveLetter = async (posIndex: number) => {
    if (gameState !== 'playing') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIndices((prev) => prev.filter((_, i) => i !== posIndex));
  };

  const timerBarStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%`,
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const timerColor = timeLeft > 15 ? '#39FF14' : timeLeft > 7 ? '#FFD700' : '#F85149';
  const formedWord = selectedIndices.map((i) => letters[i]).join('');

  return (
    <View style={styles.container}>
      {step.mindyMessage && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <MindyMessage message={step.mindyMessage} mood="thinking" />
        </Animated.View>
      )}

      {/* Timer bar */}
      <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.timerContainer}>
        <View style={styles.timerBar}>
          <Animated.View style={[styles.timerFill, timerBarStyle, { backgroundColor: timerColor }]} />
        </View>
        <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
      </Animated.View>

      {/* Hint */}
      <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.hintCard}>
        <Icon name="lightbulb" size={16} color="#FFD700" />
        <Text style={styles.hintText}>{step.hint}</Text>
      </Animated.View>

      {/* Answer slots */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={shakeStyle}>
        <View style={styles.answerRow}>
          {Array.from({ length: step.word.length }).map((_, idx) => {
            const letter = selectedIndices[idx] !== undefined ? letters[selectedIndices[idx]] : null;
            return (
              <Pressable
                key={idx}
                style={[
                  styles.answerSlot,
                  letter ? styles.answerSlotFilled : styles.answerSlotEmpty,
                  gameState === 'correct' && styles.answerSlotCorrect,
                  gameState === 'incorrect' && letter && styles.answerSlotIncorrect,
                ]}
                onPress={() => letter ? handleRemoveLetter(idx) : undefined}
              >
                <Text style={[
                  styles.answerSlotText,
                  gameState === 'correct' && { color: '#39FF14' },
                  gameState === 'incorrect' && { color: '#F85149' },
                ]}>
                  {letter?.toUpperCase() ?? ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Scrambled letters */}
      <Animated.View entering={FadeInUp.delay(300).duration(400)}>
        <View style={styles.lettersGrid}>
          {letters.map((letter, idx) => {
            const isUsed = selectedIndices.includes(idx);
            return (
              <Pressable
                key={idx}
                style={[styles.letterTile, isUsed && styles.letterTileUsed]}
                onPress={() => handleLetterPress(idx)}
                disabled={isUsed || gameState !== 'playing'}
              >
                <Text style={[styles.letterText, isUsed && styles.letterTextUsed]}>
                  {letter.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Result feedback */}
      {gameState === 'correct' && (
        <Animated.View entering={ZoomIn.duration(300)} style={styles.resultCard}>
          <Icon name="check" size={24} color="#39FF14" />
          <Text style={styles.resultTextCorrect}>Correct !</Text>
        </Animated.View>
      )}

      {gameState === 'incorrect' && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.resultCard}>
          <Icon name="x" size={24} color="#F85149" />
          <Text style={styles.resultTextIncorrect}>
            Le mot était : <Text style={styles.revealWord}>{step.word.toUpperCase()}</Text>
          </Text>
        </Animated.View>
      )}

      {/* Continue button */}
      {gameState !== 'playing' && (
        <Animated.View entering={FadeInUp.delay(200)}>
          <Pressable
            style={[
              styles.continueButton,
              { backgroundColor: gameState === 'correct' ? '#39FF14' : '#F85149' },
            ]}
            onPress={() => onAnswer(gameState === 'correct')}
          >
            <Text style={styles.continueButtonText}>Continuer</Text>
            <Icon name="arrow-right" size={18} color="#0D1117" />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#161B22',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  hintText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#E6EDF3',
    flex: 1,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  answerSlot: {
    width: 44,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  answerSlotEmpty: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderStyle: 'dashed',
  },
  answerSlotFilled: {
    backgroundColor: '#161B22',
    borderColor: '#39FF14',
  },
  answerSlotCorrect: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: '#39FF14',
  },
  answerSlotIncorrect: {
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderColor: '#F85149',
  },
  answerSlotText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 20,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  lettersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  letterTile: {
    width: 48,
    height: 52,
    backgroundColor: '#161B22',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#30363D',
  },
  letterTileUsed: {
    opacity: 0.25,
    borderColor: '#21262D',
  },
  letterText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 20,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  letterTextUsed: {
    color: '#8B949E',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  resultTextCorrect: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#39FF14',
  },
  resultTextIncorrect: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#F85149',
  },
  revealWord: {
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
    color: '#E6EDF3',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
});
