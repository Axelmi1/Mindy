import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { DragSortStep } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

interface DragSortStepViewProps {
  step: DragSortStep;
  onAnswer: (isCorrect: boolean) => void;
}

type GameState = 'playing' | 'checked';

export function DragSortStepView({ step, onAnswer }: DragSortStepViewProps) {
  // Shuffle items initially
  const initialOrder = useMemo(() => {
    const indices = step.items.map((_: unknown, i: number) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [step.items]);

  const [order, setOrder] = useState<number[]>(initialOrder);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [results, setResults] = useState<Record<number, boolean>>({});

  const moveItem = async (fromIdx: number, direction: 'up' | 'down') => {
    if (gameState !== 'playing') return;
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= order.length) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newOrder = [...order];
    [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];
    setOrder(newOrder);
  };

  const handleCheck = async () => {
    const newResults: Record<number, boolean> = {};
    let allCorrect = true;

    // Build a map of which positions each group occupies in the correct answer
    const groupCorrectPositions: Record<string, number[]> = {};
    step.correctOrder.forEach((itemIdx, pos) => {
      const group = step.items[itemIdx]?.group;
      if (group) {
        if (!groupCorrectPositions[group]) groupCorrectPositions[group] = [];
        groupCorrectPositions[group].push(pos);
      }
    });

    // Build which positions the user placed each group at
    const groupUserPositions: Record<string, number[]> = {};
    order.forEach((itemIdx, pos) => {
      const group = step.items[itemIdx]?.group;
      if (group) {
        if (!groupUserPositions[group]) groupUserPositions[group] = [];
        groupUserPositions[group].push(pos);
      }
    });

    order.forEach((itemIdx, position) => {
      const group = step.items[itemIdx]?.group;
      let isCorrect: boolean;
      if (group) {
        // For grouped items: correct if user placed this item at any position valid for this group
        const correctPositionsForGroup = groupCorrectPositions[group] || [];
        isCorrect = correctPositionsForGroup.includes(position);
      } else {
        isCorrect = step.correctOrder[position] === itemIdx;
      }
      newResults[position] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });

    setResults(newResults);
    setGameState('checked');

    if (allCorrect) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const isAllCorrect = gameState === 'checked' && Object.values(results).every(Boolean);

  return (
    <View style={styles.container}>
      {step.mindyMessage && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <MindyMessage message={step.mindyMessage} mood="thinking" />
        </Animated.View>
      )}

      {/* Question */}
      <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ gap: 4 }}>
        <Text style={styles.question}>{step.question}</Text>
        <Text style={styles.instruction}>Utilise ↑ ↓ pour changer l'ordre, puis valide.</Text>
      </Animated.View>

      {/* Sortable cards */}
      <View style={styles.cardList}>
        {order.map((itemIdx, position) => {
          const item = step.items[itemIdx];
          const result = results[position];
          const borderColor =
            gameState === 'checked'
              ? result ? '#39FF14' : '#F85149'
              : '#30363D';
          const bgColor =
            gameState === 'checked'
              ? result ? 'rgba(57, 255, 20, 0.06)' : 'rgba(248, 81, 73, 0.06)'
              : '#161B22';

          return (
            <Animated.View
              key={itemIdx}
              entering={FadeInUp.delay(100 + position * 60).duration(300)}
              layout={Layout.springify()}
            >
              <View style={[styles.card, { borderColor, backgroundColor: bgColor }]}>
                {/* Move buttons */}
                <View style={styles.moveButtons}>
                  <Pressable
                    onPress={() => moveItem(position, 'up')}
                    disabled={position === 0 || gameState !== 'playing'}
                    style={[styles.moveBtn, position === 0 && styles.moveBtnDisabled]}
                  >
                    <Icon name="chevron-up" size={16} color={position === 0 ? '#30363D' : '#8B949E'} />
                  </Pressable>
                  <Pressable
                    onPress={() => moveItem(position, 'down')}
                    disabled={position === order.length - 1 || gameState !== 'playing'}
                    style={[styles.moveBtn, position === order.length - 1 && styles.moveBtnDisabled]}
                  >
                    <Icon name="chevron-down" size={16} color={position === order.length - 1 ? '#30363D' : '#8B949E'} />
                  </Pressable>
                </View>

                {/* Card content */}
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  {item.value && <Text style={styles.cardValue}>{item.value}</Text>}
                </View>

                {/* Position number */}
                <View style={[styles.positionBadge, gameState === 'checked' && {
                  backgroundColor: result ? 'rgba(57, 255, 20, 0.15)' : 'rgba(248, 81, 73, 0.15)',
                }]}>
                  <Text style={[styles.positionText, gameState === 'checked' && {
                    color: result ? '#39FF14' : '#F85149',
                  }]}>
                    {position + 1}
                  </Text>
                </View>

                {/* Result icon */}
                {gameState === 'checked' && (
                  <Animated.View entering={ZoomIn.duration(200)}>
                    <Icon
                      name={result ? 'check' : 'x'}
                      size={16}
                      color={result ? '#39FF14' : '#F85149'}
                    />
                  </Animated.View>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Explanation after check */}
      {gameState === 'checked' && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.explanationCard}>
          <Text style={styles.explanationText}>{step.explanation}</Text>
        </Animated.View>
      )}

      {/* Check / Continue button */}
      {gameState === 'playing' ? (
        <Animated.View entering={FadeInUp.delay(400)}>
          <Pressable style={styles.checkButton} onPress={handleCheck}>
            <Text style={styles.checkButtonText}>Vérifier l'ordre</Text>
            <Icon name="check" size={18} color="#0D1117" />
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInUp.delay(200)}>
          <Pressable
            style={[styles.continueButton, { backgroundColor: isAllCorrect ? '#39FF14' : '#F85149' }]}
            onPress={() => onAnswer(isAllCorrect)}
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
  question: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
    lineHeight: 26,
  },
  instruction: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#484F58',
  },
  cardList: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  moveButtons: {
    gap: 2,
  },
  moveBtn: {
    padding: 4,
  },
  moveBtnDisabled: {
    opacity: 0.3,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardTextContainer: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  cardValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8B949E',
  },
  positionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 148, 158, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#8B949E',
  },
  explanationCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  explanationText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#C9D1D9',
    lineHeight: 22,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#39FF14',
  },
  checkButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
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
