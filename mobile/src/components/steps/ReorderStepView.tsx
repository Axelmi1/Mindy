import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ReorderStep } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ReorderStepViewProps {
  step: ReorderStep;
  onComplete: (isCorrect: boolean) => void;
}

interface WordItem {
  id: string;
  word: string;
  originalIndex: number;
}

type GameState = 'playing' | 'checking' | 'finished';

/**
 * ReorderStepView - Drag and drop words to form correct sequence
 * Uses tap-to-select and tap-to-place for simplified mobile UX
 */
export function ReorderStepView({ step, onComplete }: ReorderStepViewProps) {
  // Shuffle words initially
  const shuffledWords = useMemo(() => {
    const items: WordItem[] = step.words.map((word: string, index: number) => ({
      id: `word-${index}`,
      word,
      originalIndex: index,
    }));
    // Fisher-Yates shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [step.words]);

  const [availableWords, setAvailableWords] = useState<WordItem[]>(shuffledWords);
  const [selectedWords, setSelectedWords] = useState<WordItem[]>([]);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Check if answer is correct
  const checkAnswer = useCallback(() => {
    if (selectedWords.length !== step.words.length) return;

    setGameState('checking');

    // Build the user's order
    const userOrder = selectedWords.map((w) => w.originalIndex);

    // Compare with correct order
    const correct = step.correctOrder.every((idx: number, i: number) => userOrder[i] === idx);
    setIsCorrect(correct);

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      setGameState('finished');
      setTimeout(() => onComplete(correct), 1500);
    }, 1000);
  }, [selectedWords, step.correctOrder, step.words.length, onComplete]);

  // Auto-check when all words are placed
  useEffect(() => {
    if (selectedWords.length === step.words.length && gameState === 'playing') {
      checkAnswer();
    }
  }, [selectedWords.length, step.words.length, gameState, checkAnswer]);

  // Handle word tap from available pool
  const handleWordTap = useCallback(async (word: WordItem) => {
    if (gameState !== 'playing') return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

    // Remove from available and add to selected
    setAvailableWords((prev) => prev.filter((w) => w.id !== word.id));
    setSelectedWords((prev) => [...prev, word]);
  }, [gameState]);

  // Handle removing word from selected (tap to return)
  const handleSelectedWordTap = useCallback(async (word: WordItem, index: number) => {
    if (gameState !== 'playing') return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

    // Remove from selected and return to available
    setSelectedWords((prev) => prev.filter((w) => w.id !== word.id));
    setAvailableWords((prev) => [...prev, word]);
  }, [gameState]);

  // Reset the puzzle
  const handleReset = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setAvailableWords(shuffledWords);
    setSelectedWords([]);
    setGameState('playing');
    setIsCorrect(false);
  }, [shuffledWords]);

  // Get word style based on correctness
  const getWordStyle = (word: WordItem, index: number) => {
    if (gameState !== 'checking' && gameState !== 'finished') {
      return styles.selectedWord;
    }

    const correctIndex = step.correctOrder.indexOf(word.originalIndex);
    if (correctIndex === index) {
      return [styles.selectedWord, styles.wordCorrect];
    }
    return [styles.selectedWord, styles.wordIncorrect];
  };

  return (
    <View style={styles.container}>
      {/* Mindy Message */}
      {step.mindyMessage && (
        <Animated.View entering={FadeIn.duration(300)}>
          <MindyMessage
            message={step.mindyMessage}
            mood={gameState === 'finished' ? (isCorrect ? 'hype' : 'roast') : 'neutral'}
          />
        </Animated.View>
      )}

      {/* Title & Instructions */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.instruction}>{step.instruction}</Text>
      </Animated.View>

      {/* Selected words area (answer zone) */}
      <View style={styles.answerZone}>
        <Text style={styles.zoneLabel}>[YOUR_ANSWER]</Text>
        <View style={styles.wordRow}>
          {selectedWords.length === 0 ? (
            <Text style={styles.placeholder}>Tap words below to build your answer</Text>
          ) : (
            selectedWords.map((word, index) => (
              <Animated.View
                key={word.id}
                entering={ZoomIn.duration(200)}
                layout={Layout.springify()}
              >
                <Pressable
                  style={getWordStyle(word, index)}
                  onPress={() => handleSelectedWordTap(word, index)}
                  disabled={gameState !== 'playing'}
                >
                  <Text style={styles.wordText}>{word.word}</Text>
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>
      </View>

      {/* Available words pool */}
      <View style={styles.wordPool}>
        <Text style={styles.zoneLabel}>[AVAILABLE_WORDS]</Text>
        <View style={styles.wordRow}>
          {availableWords.map((word) => (
            <Animated.View
              key={word.id}
              entering={FadeInUp.duration(200)}
              layout={Layout.springify()}
            >
              <Pressable
                style={styles.availableWord}
                onPress={() => handleWordTap(word)}
                disabled={gameState !== 'playing'}
              >
                <Text style={styles.wordText}>{word.word}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Hint */}
      {step.hint && gameState === 'playing' && (
        <View style={styles.hintContainer}>
          <Icon name="lightbulb" size={16} color="#FFD700" />
          <Text style={styles.hintText}>{step.hint}</Text>
        </View>
      )}

      {/* Result feedback */}
      {gameState === 'finished' && (
        <Animated.View entering={ZoomIn.duration(300)} style={styles.resultContainer}>
          <View style={styles.resultRow}>
            <Icon name={isCorrect ? 'check' : 'x'} size={20} color={isCorrect ? '#39FF14' : '#F85149'} />
            <Text style={[styles.resultText, isCorrect ? styles.resultCorrect : styles.resultIncorrect]}>
              {isCorrect ? 'Perfect!' : 'Not quite right'}
            </Text>
          </View>
          {!isCorrect && (
            <Text style={styles.correctAnswer}>
              Correct: {step.correctOrder.map((i: number) => step.words[i]).join(' ')}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Reset button */}
      {gameState === 'playing' && selectedWords.length > 0 && (
        <Pressable style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>↺ Reset</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
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
  answerZone: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#39FF14',
    borderStyle: 'dashed',
    minHeight: 100,
  },
  wordPool: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    minHeight: 100,
  },
  zoneLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#484F58',
    marginBottom: 12,
  },
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  placeholder: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#484F58',
    fontStyle: 'italic',
  },
  availableWord: {
    backgroundColor: '#30363D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#484F58',
  },
  selectedWord: {
    backgroundColor: '#238636',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#39FF14',
  },
  wordCorrect: {
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    borderColor: '#39FF14',
  },
  wordIncorrect: {
    backgroundColor: 'rgba(248, 81, 73, 0.2)',
    borderColor: '#F85149',
  },
  wordText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  hintContainer: {
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#58A6FF',
  },
  hintText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#58A6FF',
  },
  resultContainer: {
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 18,
    fontWeight: '700',
  },
  resultCorrect: {
    color: '#39FF14',
  },
  resultIncorrect: {
    color: '#F85149',
  },
  correctAnswer: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8B949E',
  },
  resetButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  resetButtonText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    color: '#8B949E',
  },
});
