import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { BudgetAllocatorStep } from '@mindy/shared';
import { Icon } from '../ui/Icon';

interface BudgetAllocatorStepViewProps {
  step: BudgetAllocatorStep;
  onAnswer: (isCorrect: boolean) => void;
}

export function BudgetAllocatorStepView({ step, onAnswer }: BudgetAllocatorStepViewProps) {
  const categoryCount = step.categories.length;
  const initialPercent = Math.floor(100 / categoryCount);
  const remainder = 100 - initialPercent * categoryCount;

  const [allocations, setAllocations] = useState<number[]>(
    step.categories.map((_, i) => initialPercent + (i === 0 ? remainder : 0))
  );
  const [revealed, setRevealed] = useState(false);

  const adjustAllocation = useCallback((index: number, delta: number) => {
    setAllocations(prev => {
      const next = [...prev];
      const cat = step.categories[index];
      const newVal = Math.max(cat.minPercent, Math.min(cat.maxPercent, next[index] + delta));
      const actualDelta = newVal - next[index];
      if (actualDelta === 0) return prev;

      // Distribute the inverse delta among other categories
      next[index] = newVal;
      const othersCount = categoryCount - 1;
      const perOther = Math.floor(-actualDelta / othersCount);
      let leftover = -actualDelta - perOther * othersCount;

      for (let i = 0; i < categoryCount; i++) {
        if (i === index) continue;
        const otherCat = step.categories[i];
        const adjusted = Math.max(otherCat.minPercent, Math.min(otherCat.maxPercent, next[i] + perOther + (leftover > 0 ? 1 : leftover < 0 ? -1 : 0)));
        if (leftover > 0) leftover--;
        else if (leftover < 0) leftover++;
        next[i] = adjusted;
      }

      // Normalize to 100
      const total = next.reduce((a, b) => a + b, 0);
      if (total !== 100) {
        const diff = 100 - total;
        // Add diff to first non-capped category
        for (let i = 0; i < categoryCount; i++) {
          if (i === index) continue;
          const otherCat = step.categories[i];
          const newV = next[i] + diff;
          if (newV >= otherCat.minPercent && newV <= otherCat.maxPercent) {
            next[i] = newV;
            break;
          }
        }
      }

      return next;
    });
  }, [step.categories, categoryCount]);

  const handleValidate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRevealed(true);
  };

  const handleContinue = () => {
    // Check if all allocations are within ±10% of target
    const allCorrect = step.categories.every((cat, i) => {
      return Math.abs(allocations[i] - cat.targetPercent) <= 10;
    });
    onAnswer(allCorrect);
  };

  const totalBudgetFormatted = step.totalBudget.toLocaleString();

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.headerCard}>
        <Text style={styles.headerLabel}>BUDGET TOTAL</Text>
        <Text style={styles.budgetAmount}>{totalBudgetFormatted} $</Text>
        <Text style={styles.headerHint}>Répartis le budget entre les catégories</Text>
      </Animated.View>

      {/* Categories with sliders */}
      <View style={styles.categories}>
        {step.categories.map((cat, idx) => {
          const amount = Math.round((allocations[idx] / 100) * step.totalBudget);
          const isClose = revealed && Math.abs(allocations[idx] - cat.targetPercent) <= 10;
          const isFar = revealed && Math.abs(allocations[idx] - cat.targetPercent) > 10;

          return (
            <Animated.View
              key={idx}
              entering={FadeInUp.delay(idx * 80).duration(300)}
              style={[
                styles.categoryRow,
                revealed && isClose && styles.categoryCorrect,
                revealed && isFar && styles.categoryWrong,
              ]}
            >
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categoryPercent}>{allocations[idx]}%</Text>
                <Text style={styles.categoryAmount}>{amount.toLocaleString()} $</Text>
              </View>

              {/* Slider controls */}
              {!revealed && (
                <View style={styles.sliderRow}>
                  <Pressable
                    style={styles.sliderBtn}
                    onPress={() => adjustAllocation(idx, -5)}
                  >
                    <Icon name="minus" size={16} color="#8B949E" />
                  </Pressable>
                  <View style={styles.sliderTrack}>
                    <View
                      style={[styles.sliderFill, { width: `${allocations[idx]}%` }]}
                    />
                  </View>
                  <Pressable
                    style={styles.sliderBtn}
                    onPress={() => adjustAllocation(idx, 5)}
                  >
                    <Icon name="plus" size={16} color="#8B949E" />
                  </Pressable>
                </View>
              )}

              {/* Target reveal */}
              {revealed && (
                <Animated.View entering={FadeIn.delay(100)} style={styles.targetRow}>
                  <Text style={styles.targetText}>
                    Cible : {cat.targetPercent}%
                  </Text>
                  <Text style={[styles.deltaText, isClose ? styles.deltaGood : styles.deltaBad]}>
                    {allocations[idx] - cat.targetPercent > 0 ? '+' : ''}{allocations[idx] - cat.targetPercent}%
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Total check */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total :</Text>
        <Text style={[
          styles.totalValue,
          { color: allocations.reduce((a, b) => a + b, 0) === 100 ? '#39FF14' : '#F85149' },
        ]}>
          {allocations.reduce((a, b) => a + b, 0)}%
        </Text>
      </View>

      {/* Validate / Continue */}
      {!revealed ? (
        <Animated.View entering={FadeInUp.delay(300)}>
          <Pressable style={styles.validateButton} onPress={handleValidate}>
            <Text style={styles.validateButtonText}>Valider</Text>
            <Icon name="check" size={18} color="#0D1117" />
          </Pressable>
        </Animated.View>
      ) : (
        <>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.explanation}>
            {step.explanation}
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(300)}>
            <Pressable
              style={[styles.continueButton, {
                backgroundColor: step.categories.every((cat, i) =>
                  Math.abs(allocations[i] - cat.targetPercent) <= 10
                ) ? '#39FF14' : '#F85149',
              }]}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continuer</Text>
              <Icon name="arrow-right" size={18} color="#0D1117" />
            </Pressable>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  headerCard: {
    alignItems: 'center',
    gap: 8,
    padding: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  headerLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#8B949E',
    letterSpacing: 1,
  },
  budgetAmount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 28,
    fontWeight: '700',
    color: '#39FF14',
  },
  headerHint: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
  },
  categories: {
    gap: 10,
  },
  categoryRow: {
    backgroundColor: '#161B22',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#30363D',
    gap: 10,
  },
  categoryCorrect: {
    borderColor: 'rgba(57, 255, 20, 0.5)',
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
  },
  categoryWrong: {
    borderColor: 'rgba(248, 81, 73, 0.5)',
    backgroundColor: 'rgba(248, 81, 73, 0.05)',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryLabel: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  categoryPercent: {
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    fontWeight: '700',
    color: '#58A6FF',
    minWidth: 40,
    textAlign: 'right',
  },
  categoryAmount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8B949E',
    minWidth: 70,
    textAlign: 'right',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#21262D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#58A6FF',
    borderRadius: 4,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  targetText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
  },
  deltaText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
  },
  deltaGood: {
    color: '#39FF14',
  },
  deltaBad: {
    color: '#F85149',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    color: '#8B949E',
  },
  totalValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    fontWeight: '700',
  },
  explanation: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#C9D1D9',
    lineHeight: 22,
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#58A6FF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  validateButtonText: {
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
    marginTop: 4,
  },
  continueButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
});
