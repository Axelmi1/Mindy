import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { FillBlankStep } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

interface FillBlankStepViewProps {
  step: FillBlankStep;
  onAnswer: (isCorrect: boolean) => void;
}

type AnswerState = 'idle' | 'correct' | 'incorrect';

/**
 * FillBlankStepView — Complete a sentence by choosing the right word
 */
export function FillBlankStepView({ step, onAnswer }: FillBlankStepViewProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');

  // Split sentence at ___
  const parts = step.sentence.split('___');
  const beforeBlank = parts[0] ?? '';
  const afterBlank = parts[1] ?? '';

  const handleChoicePress = async (choice: string) => {
    if (answerState !== 'idle') return;
    setSelected(choice);
    const isCorrect = choice === step.answer;
    if (isCorrect) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAnswerState('correct');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAnswerState('incorrect');
    }
  };

  const handleContinue = () => {
    onAnswer(answerState === 'correct');
  };

  const getChoiceStyle = (choice: string) => {
    if (answerState === 'idle') return styles.choiceDefault;
    if (choice === step.answer) return styles.choiceCorrect;
    if (choice === selected && answerState === 'incorrect') return styles.choiceIncorrect;
    return styles.choiceDefault;
  };

  const getChoiceTextStyle = (choice: string) => {
    if (answerState === 'idle') return styles.choiceTextDefault;
    if (choice === step.answer) return styles.choiceTextCorrect;
    if (choice === selected && answerState === 'incorrect') return styles.choiceTextIncorrect;
    return styles.choiceTextDefault;
  };

  const filledAnswer = selected ?? '___';
  const answerColor =
    answerState === 'correct' ? '#39FF14' :
    answerState === 'incorrect' ? '#F85149' :
    '#58A6FF';

  return (
    <View style={styles.container}>
      {step.mindyMessage && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <MindyMessage message={step.mindyMessage} mood="thinking" />
        </Animated.View>
      )}

      {/* Sentence with blank */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.sentenceCard}>
        <Text style={styles.sentenceText}>
          <Text>{beforeBlank}</Text>
          <Text style={[styles.blankText, { color: answerColor, borderBottomColor: answerColor }]}>
            {' '}{filledAnswer}{' '}
          </Text>
          <Text>{afterBlank}</Text>
        </Text>

        {answerState !== 'idle' && (
          <Animated.View entering={ZoomIn.duration(250)} style={styles.answerIcon}>
            <Icon
              name={answerState === 'correct' ? 'check' : 'x'}
              size={20}
              color={answerColor}
            />
          </Animated.View>
        )}
      </Animated.View>

      {/* Choices grid */}
      <View style={styles.choicesGrid}>
        {step.choices.map((choice, idx) => (
          <Animated.View
            key={idx}
            entering={FadeInUp.delay(150 + idx * 70).duration(280)}
            style={styles.choiceWrapper}
          >
            <Pressable
              style={[styles.choice, getChoiceStyle(choice)]}
              onPress={() => handleChoicePress(choice)}
              disabled={answerState !== 'idle'}
            >
              {choice === step.answer && answerState !== 'idle' && (
                <Icon name="check" size={14} color="#39FF14" />
              )}
              {choice === selected && answerState === 'incorrect' && (
                <Icon name="x" size={14} color="#F85149" />
              )}
              <Text style={[styles.choiceText, getChoiceTextStyle(choice)]}>
                {choice}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* Explanation after wrong answer */}
      {answerState === 'incorrect' && (
        <Animated.View entering={FadeInUp.duration(350)}>
          <MindyMessage
            message={`La bonne réponse est : ${step.answer}`}
            mood="thinking"
          />
        </Animated.View>
      )}

      {/* Continue */}
      {answerState !== 'idle' && (
        <Animated.View entering={FadeInUp.delay(200)}>
          <Pressable
            style={[
              styles.continueButton,
              { backgroundColor: answerState === 'correct' ? '#39FF14' : '#F85149' },
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
    gap: 24,
  },
  sentenceCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#30363D',
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sentenceText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#E6EDF3',
    lineHeight: 30,
  },
  blankText: {
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
    fontSize: 18,
    borderBottomWidth: 2,
    paddingBottom: 2,
  },
  answerIcon: {
    marginLeft: 8,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceWrapper: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 52,
  },
  choiceDefault: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  choiceCorrect: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: '#39FF14',
  },
  choiceIncorrect: {
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderColor: '#F85149',
  },
  choiceText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  choiceTextDefault: {
    color: '#E6EDF3',
  },
  choiceTextCorrect: {
    color: '#39FF14',
  },
  choiceTextIncorrect: {
    color: '#F85149',
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
