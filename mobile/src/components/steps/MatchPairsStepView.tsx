import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { MatchPairsStep } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

interface MatchPairsStepViewProps {
  step: MatchPairsStep;
  onAnswer: (isCorrect: boolean) => void;
}

type MatchState = 'idle' | 'done';

/**
 * MatchPairsStepView — Tap a term then tap its matching definition
 */
export function MatchPairsStepView({ step, onAnswer }: MatchPairsStepViewProps) {
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [matched, setMatched] = useState<Record<number, number>>({}); // termIdx -> defIdx
  const [wrongPair, setWrongPair] = useState<{ term: number; def: number } | null>(null);
  const [state, setState] = useState<MatchState>('idle');

  const shuffledDefs = React.useMemo(() => {
    const indices = step.pairs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices; // shuffledDefs[displayIdx] = originalIdx
  }, []);

  const matchedTerms = Object.keys(matched).map(Number);
  const allMatched = matchedTerms.length === step.pairs.length;
  const mistakes = Object.values(matched).filter(
    (defIdx, termIdx) => defIdx !== Object.keys(matched).map(Number)[termIdx]
  ).length;

  const handleTermPress = (termIdx: number) => {
    if (matched[termIdx] !== undefined) return;
    setSelectedTerm(termIdx === selectedTerm ? null : termIdx);
    setWrongPair(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDefPress = (displayIdx: number) => {
    if (selectedTerm === null) return;
    const originalDefIdx = shuffledDefs[displayIdx];

    // Check if this def is already matched
    const alreadyMatchedTerm = Object.entries(matched).find(
      ([, v]) => v === originalDefIdx
    );
    if (alreadyMatchedTerm) return;

    const isCorrect = originalDefIdx === selectedTerm;

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMatched(prev => ({ ...prev, [selectedTerm]: originalDefIdx }));
      setSelectedTerm(null);
      setWrongPair(null);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrongPair({ term: selectedTerm, def: originalDefIdx });
      setSelectedTerm(null);
      setTimeout(() => setWrongPair(null), 700);
    }
  };

  const handleContinue = () => {
    // All matched: isCorrect = no wrong attempts tracked
    // We simplify: correct if all matched (they can't proceed otherwise)
    onAnswer(true);
  };

  const getTermStyle = (termIdx: number) => {
    if (matched[termIdx] !== undefined) return styles.chipMatched;
    if (selectedTerm === termIdx) return styles.chipSelected;
    if (wrongPair?.term === termIdx) return styles.chipWrong;
    return styles.chipDefault;
  };

  const getDefStyle = (displayIdx: number) => {
    const originalIdx = shuffledDefs[displayIdx];
    const isMatchedByAny = Object.values(matched).includes(originalIdx);
    if (isMatchedByAny) return styles.chipMatched;
    if (wrongPair?.def === originalIdx) return styles.chipWrong;
    if (selectedTerm !== null) return styles.chipSelectable;
    return styles.chipDefault;
  };

  return (
    <View style={styles.container}>
      <Animated.Text entering={FadeInDown.duration(350)} style={styles.instruction}>
        Relie chaque terme à sa définition
      </Animated.Text>

      {step.mindyMessage && (
        <Animated.View entering={FadeInDown.delay(100)}>
          <MindyMessage message={step.mindyMessage} mood="thinking" />
        </Animated.View>
      )}

      <View style={styles.columns}>
        {/* Terms (left) */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>Termes</Text>
          {step.pairs.map((pair, termIdx) => (
            <Animated.View
              key={`term-${termIdx}`}
              entering={FadeInDown.delay(termIdx * 60).duration(280)}
            >
              <Pressable
                style={[styles.chip, getTermStyle(termIdx)]}
                onPress={() => handleTermPress(termIdx)}
                disabled={matched[termIdx] !== undefined}
              >
                {matched[termIdx] !== undefined && (
                  <Icon name="check" size={12} color="#39FF14" />
                )}
                <Text
                  style={[
                    styles.chipText,
                    matched[termIdx] !== undefined && styles.chipTextMatched,
                    selectedTerm === termIdx && styles.chipTextSelected,
                  ]}
                  numberOfLines={2}
                >
                  {pair.term}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Arrow divider */}
        <View style={styles.divider}>
          {step.pairs.map((_, i) => (
            <View key={i} style={styles.dividerDot} />
          ))}
        </View>

        {/* Definitions (right) */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>Définitions</Text>
          {shuffledDefs.map((originalIdx, displayIdx) => (
            <Animated.View
              key={`def-${displayIdx}`}
              entering={FadeInDown.delay(displayIdx * 60 + 30).duration(280)}
            >
              <Pressable
                style={[styles.chip, getDefStyle(displayIdx)]}
                onPress={() => handleDefPress(displayIdx)}
                disabled={
                  selectedTerm === null ||
                  Object.values(matched).includes(originalIdx)
                }
              >
                {Object.values(matched).includes(originalIdx) && (
                  <Icon name="check" size={12} color="#39FF14" />
                )}
                <Text
                  style={[
                    styles.chipText,
                    Object.values(matched).includes(originalIdx) && styles.chipTextMatched,
                  ]}
                  numberOfLines={3}
                >
                  {step.pairs[originalIdx].definition}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressRow}>
        {step.pairs.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              matchedTerms.includes(i) && styles.progressDotFilled,
            ]}
          />
        ))}
      </View>

      {/* Continue once all matched */}
      {allMatched && (
        <Animated.View entering={ZoomIn.duration(300)}>
          <Pressable style={styles.continueButton} onPress={handleContinue}>
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
  instruction: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    color: '#E6EDF3',
    lineHeight: 28,
  },
  columns: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    gap: 8,
  },
  columnHeader: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#484F58',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  divider: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 30,
    gap: 16,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#30363D',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 48,
  },
  chipDefault: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  chipSelected: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderColor: '#39FF14',
  },
  chipSelectable: {
    backgroundColor: '#161B22',
    borderColor: '#58A6FF',
    borderStyle: 'dashed',
  },
  chipMatched: {
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  chipWrong: {
    backgroundColor: 'rgba(248, 81, 73, 0.12)',
    borderColor: '#F85149',
  },
  chipText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#C9D1D9',
    lineHeight: 18,
  },
  chipTextSelected: {
    color: '#39FF14',
    fontWeight: '600',
  },
  chipTextMatched: {
    color: 'rgba(57, 255, 20, 0.7)',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30363D',
  },
  progressDotFilled: {
    backgroundColor: '#39FF14',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#39FF14',
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
