import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ScenarioStep, ScenarioChoice } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

interface ScenarioStepViewProps {
  step: ScenarioStep;
  onAnswer: (isCorrect: boolean) => void;
}

/**
 * ScenarioStepView — Real-world situation with multiple valid approaches
 * Reveals explanation + good/bad badge after selection
 */
export function ScenarioStepView({ step, onAnswer }: ScenarioStepViewProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleChoicePress = async (idx: number) => {
    if (revealed) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIdx(idx);
    setRevealed(true);
  };

  const handleContinue = () => {
    if (selectedIdx === null) return;
    const isCorrect = step.choices[selectedIdx].isGood;
    onAnswer(isCorrect);
  };

  const getChoiceStyle = (idx: number, choice: ScenarioChoice) => {
    if (!revealed) {
      return idx === selectedIdx ? styles.choiceSelected : styles.choiceDefault;
    }
    if (choice.isGood) return styles.choiceGood;
    if (idx === selectedIdx && !choice.isGood) return styles.choiceBad;
    return styles.choiceDimmed;
  };

  return (
    <View style={styles.container}>
      {/* Situation card */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.situationCard}>
        <View style={styles.situationHeader}>
          <Icon name="alert" size={16} color="#FFD700" />
          <Text style={styles.situationLabel}>SITUATION</Text>
        </View>
        <Text style={styles.situationText}>{step.situation}</Text>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(150)} style={styles.chooseLabel}>
        Quelle est ta réaction ?
      </Animated.Text>

      {/* Choices */}
      <View style={styles.choices}>
        {step.choices.map((choice, idx) => (
          <Animated.View
            key={idx}
            entering={FadeInUp.delay(200 + idx * 80).duration(300)}
            layout={Layout.springify()}
          >
            <Pressable
              style={[styles.choice, getChoiceStyle(idx, choice)]}
              onPress={() => handleChoicePress(idx)}
              disabled={revealed}
            >
              <View style={styles.choiceTop}>
                {/* Badge before/after reveal */}
                {!revealed ? (
                  <View style={styles.choiceIndex}>
                    <Text style={styles.choiceIndexText}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                ) : (
                  <Animated.View entering={ZoomIn.duration(250)} style={[
                    styles.choiceResultBadge,
                    choice.isGood ? styles.badgeGood : styles.badgeBad,
                  ]}>
                    <Icon
                      name={choice.isGood ? 'check' : 'x'}
                      size={14}
                      color={choice.isGood ? '#39FF14' : '#F85149'}
                    />
                  </Animated.View>
                )}

                <Text style={[
                  styles.choiceText,
                  revealed && choice.isGood && styles.choiceTextGood,
                  revealed && !choice.isGood && idx === selectedIdx && styles.choiceTextBad,
                  revealed && !choice.isGood && idx !== selectedIdx && styles.choiceTextDimmed,
                ]}>
                  {choice.text}
                </Text>

                {/* Selected marker */}
                {idx === selectedIdx && !revealed && (
                  <Icon name="chevron-right" size={16} color="#58A6FF" />
                )}
              </View>

              {/* Explanation revealed after selection */}
              {revealed && (
                <Animated.View entering={FadeIn.delay(100).duration(350)} style={styles.explanation}>
                  <Text style={[
                    styles.explanationText,
                    choice.isGood ? styles.explanationTextGood : styles.explanationTextBad,
                  ]}>
                    {choice.explanation}
                  </Text>
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* Mindy reaction after reveal */}
      {revealed && step.mindyMessage && (
        <Animated.View entering={FadeInUp.delay(400)}>
          <MindyMessage
            message={step.mindyMessage}
            mood={step.choices[selectedIdx!]?.isGood ? 'hype' : 'thinking'}
          />
        </Animated.View>
      )}

      {/* Continue */}
      {revealed && (
        <Animated.View entering={FadeInUp.delay(selectedIdx !== null ? 500 : 200)}>
          <Pressable
            style={[
              styles.continueButton,
              {
                backgroundColor: selectedIdx !== null && step.choices[selectedIdx].isGood
                  ? '#39FF14'
                  : '#F85149',
              },
            ]}
            onPress={handleContinue}
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
  situationCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 10,
  },
  situationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  situationLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1,
  },
  situationText: {
    fontFamily: 'Inter',
    fontSize: 17,
    fontWeight: '600',
    color: '#E6EDF3',
    lineHeight: 26,
  },
  chooseLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  choices: {
    gap: 10,
  },
  choice: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  choiceDefault: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  choiceSelected: {
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
    borderColor: '#58A6FF',
  },
  choiceGood: {
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderColor: 'rgba(57, 255, 20, 0.5)',
  },
  choiceBad: {
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderColor: '#F85149',
  },
  choiceDimmed: {
    backgroundColor: '#161B22',
    borderColor: '#21262D',
    opacity: 0.55,
  },
  choiceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  choiceIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  choiceIndexText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#8B949E',
  },
  choiceResultBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeGood: {
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
  },
  badgeBad: {
    backgroundColor: 'rgba(248, 81, 73, 0.2)',
  },
  choiceText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '500',
    color: '#C9D1D9',
  },
  choiceTextGood: {
    color: '#39FF14',
    fontWeight: '600',
  },
  choiceTextBad: {
    color: '#F85149',
  },
  choiceTextDimmed: {
    color: '#484F58',
  },
  explanation: {
    paddingLeft: 38,
    paddingTop: 4,
  },
  explanationText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 19,
  },
  explanationTextGood: {
    color: 'rgba(57, 255, 20, 0.8)',
  },
  explanationTextBad: {
    color: 'rgba(248, 81, 73, 0.8)',
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
