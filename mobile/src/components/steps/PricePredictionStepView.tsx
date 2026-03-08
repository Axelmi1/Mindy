import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { PricePredictionStep } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

interface PricePredictionStepViewProps {
  step: PricePredictionStep;
  onAnswer: (isCorrect: boolean) => void;
}

export function PricePredictionStepView({ step, onAnswer }: PricePredictionStepViewProps) {
  const [timeLeft, setTimeLeft] = useState(6);
  const [selected, setSelected] = useState<'up' | 'down' | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Animated bar heights
  const barAnimations = step.priceData.map(() => useSharedValue(0));

  // Animate bars on mount
  useEffect(() => {
    const maxPrice = Math.max(...step.priceData);
    const minPrice = Math.min(...step.priceData);
    const range = maxPrice - minPrice || 1;

    step.priceData.forEach((price, i) => {
      const normalizedHeight = 0.2 + ((price - minPrice) / range) * 0.8;
      barAnimations[i].value = withDelay(
        i * 80,
        withTiming(normalizedHeight, { duration: 400, easing: Easing.out(Easing.cubic) })
      );
    });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (revealed || selected) return;
    if (timeLeft <= 0) {
      setTimedOut(true);
      setRevealed(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, revealed, selected]);

  const handleSelect = useCallback(async (direction: 'up' | 'down') => {
    if (revealed || selected) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(direction);
    setRevealed(true);
  }, [revealed, selected]);

  const handleContinue = () => {
    if (timedOut) {
      onAnswer(false);
      return;
    }
    onAnswer(selected === step.correctAnswer);
  };

  const isCorrect = selected === step.correctAnswer;
  const feedbackColor = isCorrect ? '#39FF14' : '#F85149';

  // Determine trend color for bars
  const trendUp = step.priceData[step.priceData.length - 1] >= step.priceData[0];

  return (
    <View style={styles.container}>
      {/* Question */}
      <Animated.Text entering={FadeInDown.duration(300)} style={styles.question}>
        {step.question}
      </Animated.Text>

      {/* Timer */}
      {!revealed && (
        <Animated.View entering={FadeIn} style={styles.timerRow}>
          <Icon name="clock" size={14} color={timeLeft <= 2 ? '#F85149' : '#8B949E'} />
          <Text style={[styles.timerText, timeLeft <= 2 && styles.timerUrgent]}>
            {timeLeft}s
          </Text>
        </Animated.View>
      )}

      {/* Sparkline Chart (View-based bars) */}
      <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.chartContainer}>
        <View style={styles.chartInner}>
          {step.priceData.map((price, i) => {
            const animStyle = useAnimatedStyle(() => ({
              height: `${barAnimations[i].value * 100}%`,
            }));
            const isLast = i === step.priceData.length - 1;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.bar,
                  animStyle,
                  {
                    backgroundColor: isLast
                      ? (trendUp ? '#39FF14' : '#F85149')
                      : 'rgba(88, 166, 255, 0.6)',
                  },
                  isLast && styles.barLast,
                ]}
              />
            );
          })}
        </View>

        {/* Price labels */}
        <View style={styles.priceLabels}>
          <Text style={styles.priceLabel}>
            {Math.min(...step.priceData).toLocaleString()}
          </Text>
          <Text style={styles.priceLabel}>
            {Math.max(...step.priceData).toLocaleString()}
          </Text>
        </View>
      </Animated.View>

      {/* Question mark for next bar */}
      {!revealed && (
        <Animated.Text entering={FadeIn.delay(800)} style={styles.predictionHint}>
          Le prochain point sera...
        </Animated.Text>
      )}

      {/* Prediction buttons */}
      {!revealed && (
        <Animated.View entering={FadeInUp.delay(200)} style={styles.buttonRow}>
          <Pressable
            style={[styles.predictionButton, styles.upButton]}
            onPress={() => handleSelect('up')}
          >
            <Icon name="trending-up" size={24} color="#39FF14" />
            <Text style={[styles.predictionButtonText, { color: '#39FF14' }]}>Hausse</Text>
          </Pressable>
          <Pressable
            style={[styles.predictionButton, styles.downButton]}
            onPress={() => handleSelect('down')}
          >
            <Icon name="trending-down" size={24} color="#F85149" />
            <Text style={[styles.predictionButtonText, { color: '#F85149' }]}>Baisse</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Result */}
      {revealed && (
        <>
          {timedOut ? (
            <Animated.View entering={ZoomIn.duration(300)} style={styles.resultCard}>
              <Icon name="clock" size={28} color="#F85149" />
              <Text style={[styles.resultText, { color: '#F85149' }]}>Temps écoulé !</Text>
            </Animated.View>
          ) : (
            <Animated.View entering={ZoomIn.duration(300)} style={[styles.resultCard, { borderColor: feedbackColor }]}>
              <Icon name={isCorrect ? 'check' : 'x'} size={28} color={feedbackColor} />
              <Text style={[styles.resultText, { color: feedbackColor }]}>
                {isCorrect ? 'Bonne prédiction !' : 'Mauvaise prédiction'}
              </Text>
              <Text style={styles.correctAnswer}>
                Réponse : {step.correctAnswer === 'up' ? 'Hausse' : 'Baisse'}
              </Text>
            </Animated.View>
          )}

          <Animated.Text entering={FadeIn.delay(200)} style={styles.explanation}>
            {step.explanation}
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(300)}>
            <MindyMessage message={step.mindyMessage} mood={isCorrect ? 'hype' : 'thinking'} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400)}>
            <Pressable
              style={[styles.continueButton, { backgroundColor: feedbackColor }]}
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
  question: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
    lineHeight: 26,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
  },
  timerText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    fontWeight: '700',
    color: '#8B949E',
  },
  timerUrgent: {
    color: '#F85149',
  },
  chartContainer: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    gap: 8,
  },
  chartInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 6,
  },
  bar: {
    flex: 1,
    borderRadius: 4,
    minHeight: 8,
  },
  barLast: {
    opacity: 0.9,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#484F58',
  },
  predictionHint: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  predictionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  upButton: {
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  downButton: {
    backgroundColor: 'rgba(248, 81, 73, 0.08)',
    borderColor: 'rgba(248, 81, 73, 0.4)',
  },
  predictionButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    alignItems: 'center',
    gap: 8,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  resultText: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
  },
  correctAnswer: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8B949E',
  },
  explanation: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#C9D1D9',
    lineHeight: 22,
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
