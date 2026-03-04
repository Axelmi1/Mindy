import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { SwipeStep } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeStepViewProps {
  step: SwipeStep;
  onAnswer: (isCorrect: boolean) => void;
}

type AnswerState = 'idle' | 'correct' | 'incorrect';

/**
 * SwipeStepView - True/False with swipe gesture or button tap
 */
export function SwipeStepView({ step, onAnswer }: SwipeStepViewProps) {
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);

  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleAnswer = async (answer: boolean) => {
    if (answerState !== 'idle') return;

    setUserAnswer(answer);
    const isCorrect = answer === step.isCorrect;

    if (isCorrect) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAnswerState('correct');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAnswerState('incorrect');
    }
  };

  const handleContinue = () => {
    const isCorrect = userAnswer === step.isCorrect;
    onAnswer(isCorrect);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (answerState !== 'idle') return;
      translateX.value = e.translationX;
      scale.value = 1 - Math.abs(e.translationX) / SCREEN_WIDTH * 0.1;
    })
    .onEnd((e) => {
      if (answerState !== 'idle') return;

      if (e.translationX > SWIPE_THRESHOLD) {
        // Swiped right = TRUE
        runOnJS(handleAnswer)(true);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        // Swiped left = FALSE
        runOnJS(handleAnswer)(false);
      }

      translateX.value = withSpring(0);
      scale.value = withSpring(1);
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${translateX.value / 20}deg` },
    ],
  }));

  const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -30 ? Math.min(1, Math.abs(translateX.value) / 100) : 0,
  }));

  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 30 ? Math.min(1, translateX.value / 100) : 0,
  }));

  return (
    <View style={styles.container}>
      {/* Instructions */}
      <Animated.View entering={FadeInDown.duration(300)}>
        <Text style={styles.instruction}>
          Is this statement TRUE or FALSE?
        </Text>
      </Animated.View>

      {/* Swipe indicators */}
      <View style={styles.indicatorRow}>
        <Animated.View style={[styles.indicator, styles.falseIndicator, leftIndicatorStyle]}>
          <Text style={styles.indicatorText}>FALSE</Text>
        </Animated.View>
        <Animated.View style={[styles.indicator, styles.trueIndicator, rightIndicatorStyle]}>
          <Text style={styles.indicatorText}>TRUE</Text>
        </Animated.View>
      </View>

      {/* Statement Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.statementCard,
            cardAnimatedStyle,
            answerState === 'correct' && styles.cardCorrect,
            answerState === 'incorrect' && styles.cardIncorrect,
          ]}
          entering={FadeInUp.duration(400).delay(200)}
        >
          <Text style={styles.statement}>{step.statement}</Text>

          {answerState !== 'idle' && (
            <View style={styles.resultBadge}>
              <Icon
                name={answerState === 'correct' ? 'check' : 'x'}
                size={20}
                color={answerState === 'correct' ? '#39FF14' : '#F85149'}
              />
              <Text style={[
                styles.resultText,
                answerState === 'correct' ? styles.resultCorrect : styles.resultIncorrect
              ]}>
                {answerState === 'correct' ? 'Correct!' : 'Wrong!'}
              </Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>

      {/* Button fallback */}
      {answerState === 'idle' && (
        <Animated.View
          style={styles.buttonRow}
          entering={FadeInUp.duration(300).delay(400)}
        >
          <Pressable
            style={[styles.button, styles.falseButton]}
            onPress={() => handleAnswer(false)}
          >
            <Text style={styles.buttonText}>FALSE</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.trueButton]}
            onPress={() => handleAnswer(true)}
          >
            <Text style={styles.buttonText}>TRUE</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Explanation after answer */}
      {answerState !== 'idle' && (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.explanationContainer}>
          <MindyMessage
            message={step.explanation}
            mood={answerState === 'correct' ? 'hype' : 'roast'}
          />
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
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  indicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  falseIndicator: {
    backgroundColor: 'rgba(248, 81, 73, 0.2)',
  },
  trueIndicator: {
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
  },
  indicatorText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  statementCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 32,
    borderWidth: 2,
    borderColor: '#30363D',
    minHeight: 180,
    justifyContent: 'center',
  },
  cardCorrect: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
  },
  cardIncorrect: {
    borderColor: '#F85149',
    backgroundColor: 'rgba(248, 81, 73, 0.05)',
  },
  statement: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    color: '#E6EDF3',
    textAlign: 'center',
    lineHeight: 30,
  },
  resultBadge: {
    marginTop: 20,
    alignItems: 'center',
  },
  resultText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCorrect: {
    color: '#39FF14',
  },
  resultIncorrect: {
    color: '#F85149',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  falseButton: {
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderColor: '#F85149',
  },
  trueButton: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: '#39FF14',
  },
  buttonText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  explanationContainer: {
    gap: 16,
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
