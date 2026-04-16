import React, { useState, useRef } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { CalculatorStep } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';
import { Calculator } from '../ui/Calculator';

interface CalculatorStepViewProps {
  step: CalculatorStep;
  onAnswer: (isCorrect: boolean) => void;
}

type AnswerState = 'idle' | 'correct' | 'incorrect';

/**
 * CalculatorStepView — Solve a real financial calculation
 */
export function CalculatorStepView({ step, onAnswer }: CalculatorStepViewProps) {
  const [input, setInput] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [showCalculator, setShowCalculator] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const shakeValue = useSharedValue(0);

  const tolerance = step.tolerance ?? 0;

  const handleValidate = async () => {
    const userNum = parseFloat(input.replace(',', '.'));
    if (isNaN(userNum)) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      shakeValue.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      return;
    }

    const isCorrect = Math.abs(userNum - step.answer) <= tolerance;

    if (isCorrect) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAnswerState('correct');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeValue.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      setAnswerState('incorrect');
    }
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value }],
  }));

  const handleContinue = () => {
    onAnswer(answerState === 'correct');
  };

  const borderColor =
    answerState === 'correct' ? '#39FF14' :
    answerState === 'incorrect' ? '#F85149' :
    input.length > 0 ? '#58A6FF' : '#30363D';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Animated.View entering={FadeInDown.duration(350)}>
        <Text style={styles.question}>{step.question}</Text>
      </Animated.View>

      {/* Variables card */}
      {step.variables.length > 0 && (
        <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.variablesCard}>
          <View style={styles.variablesHeader}>
            <Icon name="calculator" size={14} color="#58A6FF" />
            <Text style={styles.variablesHeaderText}>Données</Text>
          </View>
          {step.variables.map((v, i) => (
            <View key={i} style={styles.variableRow}>
              <View style={styles.variableBullet} />
              <Text style={styles.variableText}>{v}</Text>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Calculator toggle */}
      {answerState === 'idle' && (
        <Animated.View entering={FadeInDown.delay(180)}>
          <Pressable
            style={styles.calculatorToggle}
            onPress={() => setShowCalculator(v => !v)}
          >
            <Icon name="calculator" size={16} color="#58A6FF" />
            <Text style={styles.calculatorToggleText}>
              {showCalculator ? 'Masquer la calculatrice' : 'Ouvrir la calculatrice'}
            </Text>
            <Icon name={showCalculator ? 'chevron-up' : 'chevron-down'} size={14} color="#58A6FF" />
          </Pressable>
        </Animated.View>
      )}

      {showCalculator && answerState === 'idle' && (
        <Calculator />
      )}

      {/* Input area */}
      <Animated.View entering={FadeInDown.delay(200)} style={shakeStyle}>
        <View style={[styles.inputContainer, { borderColor }]}>
          <Animated.View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              keyboardType="decimal-pad"
              placeholder="Ton résultat..."
              placeholderTextColor="#484F58"
              editable={answerState === 'idle'}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={answerState === 'idle' ? handleValidate : undefined}
            />
            {step.unit && (
              <Text style={styles.unit}>{step.unit}</Text>
            )}
            {answerState !== 'idle' && (
              <Animated.View entering={ZoomIn.duration(250)}>
                <Icon
                  name={answerState === 'correct' ? 'check' : 'x'}
                  size={22}
                  color={answerState === 'correct' ? '#39FF14' : '#F85149'}
                />
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </Animated.View>

      {/* Result feedback */}
      {answerState !== 'idle' && (
        <Animated.View entering={FadeInUp.duration(350)}>
          {answerState === 'correct' ? (
            <View style={styles.correctBanner}>
              <Icon name="check" size={16} color="#39FF14" />
              <Text style={styles.correctText}>Exact ! {step.answer}{step.unit ?? ''}</Text>
            </View>
          ) : (
            <View style={styles.incorrectBanner}>
              <Icon name="info" size={16} color="#FFD700" />
              <Text style={styles.incorrectText}>
                La bonne réponse était {step.answer}{step.unit ?? ''}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {step.mindyMessage && answerState !== 'idle' && (
        <Animated.View entering={FadeInUp.delay(150)}>
          <MindyMessage
            message={step.mindyMessage}
            mood={answerState === 'correct' ? 'hype' : 'thinking'}
          />
        </Animated.View>
      )}

      {/* Validate or continue */}
      {answerState === 'idle' ? (
        <Animated.View entering={FadeInUp.delay(300)}>
          <Pressable
            style={[styles.validateButton, input.length === 0 && styles.validateButtonDisabled]}
            onPress={handleValidate}
            disabled={input.length === 0}
          >
            <Icon name="check" size={18} color="#0D1117" />
            <Text style={styles.validateButtonText}>Valider</Text>
          </Pressable>
        </Animated.View>
      ) : (
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },
  question: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    color: '#E6EDF3',
    lineHeight: 30,
  },
  variablesCard: {
    backgroundColor: '#161B22',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(88, 166, 255, 0.25)',
    gap: 8,
  },
  variablesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  variablesHeaderText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#58A6FF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  variableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  variableBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#58A6FF',
  },
  variableText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    color: '#C9D1D9',
    flex: 1,
  },
  calculatorToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(88, 166, 255, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(88, 166, 255, 0.25)',
  },
  calculatorToggleText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#58A6FF',
  },
  inputContainer: {
    backgroundColor: '#161B22',
    borderRadius: 14,
    borderWidth: 2,
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'JetBrainsMono',
    fontSize: 28,
    fontWeight: '700',
    color: '#E6EDF3',
    padding: 0,
  },
  unit: {
    fontFamily: 'JetBrainsMono',
    fontSize: 20,
    fontWeight: '600',
    color: '#8B949E',
  },
  correctBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  correctText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '600',
    color: '#39FF14',
  },
  incorrectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  incorrectText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    flex: 1,
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#39FF14',
    paddingVertical: 16,
    borderRadius: 12,
  },
  validateButtonDisabled: {
    backgroundColor: '#21262D',
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
  },
  continueButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
});
