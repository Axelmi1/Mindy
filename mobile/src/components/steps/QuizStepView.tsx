import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { QuizStep } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';
import { Calculator } from '../ui/Calculator';

interface QuizStepViewProps {
  step: QuizStep;
  onAnswer: (isCorrect: boolean) => void;
}

type AnswerState = 'idle' | 'correct' | 'incorrect';

/**
 * QuizStepView - Multiple choice question with animated feedback
 */
export function QuizStepView({ step, onAnswer }: QuizStepViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [showHint, setShowHint] = useState(false);
  const [showCalculator, setShowCalculator] = useState(step.showCalculator ?? false);

  const handleOptionPress = async (index: number) => {
    if (answerState !== 'idle') return;

    setSelectedIndex(index);
    const isCorrect = index === step.correctIndex;

    if (isCorrect) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAnswerState('correct');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAnswerState('incorrect');
      setShowHint(true);
    }
  };

  const handleContinue = () => {
    if (selectedIndex === null) return;
    const isCorrect = selectedIndex === step.correctIndex;
    onAnswer(isCorrect);
  };

  const getOptionStyle = (index: number) => {
    if (selectedIndex === null) return styles.optionDefault;
    if (index === step.correctIndex && answerState !== 'idle') {
      return styles.optionCorrect;
    }
    if (index === selectedIndex && answerState === 'incorrect') {
      return styles.optionIncorrect;
    }
    return styles.optionDefault;
  };

  const getOptionTextStyle = (index: number) => {
    if (selectedIndex === null) return styles.optionTextDefault;
    if (index === step.correctIndex && answerState !== 'idle') {
      return styles.optionTextCorrect;
    }
    if (index === selectedIndex && answerState === 'incorrect') {
      return styles.optionTextIncorrect;
    }
    return styles.optionTextDefault;
  };

  return (
    <View style={styles.container}>
      {/* Question */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={styles.question}>{step.question}</Text>
      </Animated.View>

      {/* Calculator toggle button */}
      {step.showCalculator && answerState === 'idle' && (
        <Animated.View entering={FadeInUp.duration(300).delay(100)}>
          <Pressable
            style={styles.calculatorToggle}
            onPress={() => setShowCalculator(!showCalculator)}
          >
            <Icon name="calculator" size={18} color="#58A6FF" />
            <Text style={styles.calculatorToggleText}>
              {showCalculator ? 'Masquer la calculatrice' : 'Afficher la calculatrice'}
            </Text>
            <Icon
              name={showCalculator ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#58A6FF"
            />
          </Pressable>
        </Animated.View>
      )}

      {/* Calculator */}
      {showCalculator && answerState === 'idle' && (
        <Calculator />
      )}

      {/* Options */}
      <View style={styles.optionsContainer}>
        {step.options.map((option, index) => (
          <Animated.View
            key={index}
            entering={FadeInUp.duration(300).delay(100 + index * 80)}
          >
            <Pressable
              style={[styles.option, getOptionStyle(index)]}
              onPress={() => handleOptionPress(index)}
              disabled={answerState !== 'idle'}
            >
              <View style={styles.optionIndex}>
                <Text style={styles.optionIndexText}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={[styles.optionText, getOptionTextStyle(index)]}>
                {option}
              </Text>
              {index === step.correctIndex && answerState !== 'idle' && (
                <Icon name="check" size={20} color="#39FF14" />
              )}
              {index === selectedIndex && answerState === 'incorrect' && (
                <Icon name="x" size={20} color="#F85149" />
              )}
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* Hint on wrong answer */}
      {showHint && step.mindyHint && (
        <Animated.View entering={FadeInUp.duration(400)}>
          <MindyMessage
            message={step.mindyHint}
            mood="thinking"
          />
        </Animated.View>
      )}

      {/* Continue button after answer */}
      {answerState !== 'idle' && (
        <Animated.View entering={FadeInUp.duration(400).delay(200)}>
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
    gap: 24,
  },
  question: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '600',
    color: '#E6EDF3',
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionDefault: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  optionCorrect: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: '#39FF14',
  },
  optionIncorrect: {
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderColor: '#F85149',
  },
  optionIndex: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIndexText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '600',
    color: '#8B949E',
  },
  optionText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 16,
  },
  optionTextDefault: {
    color: '#E6EDF3',
  },
  optionTextCorrect: {
    color: '#39FF14',
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: '#F85149',
  },
  checkmark: {
    fontSize: 20,
    color: '#39FF14',
    marginLeft: 8,
  },
  crossmark: {
    fontSize: 20,
    color: '#F85149',
    marginLeft: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#39FF14',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  continueButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  calculatorToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(88, 166, 255, 0.3)',
  },
  calculatorToggleText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#58A6FF',
  },
});
