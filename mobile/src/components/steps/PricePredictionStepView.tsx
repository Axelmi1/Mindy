import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { PricePredictionStep, Candle } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

const CHART_HEIGHT = 180;
const CANDLE_GAP = 4;
const WICK_WIDTH = 1.5;

interface CandlestickChartProps {
  candles: Candle[];
  revealed: boolean;
  correctAnswer: 'up' | 'down';
}

function CandlestickChart({ candles, revealed, correctAnswer }: CandlestickChartProps) {
  const { width } = Dimensions.get('window');
  const chartWidth = width - 32 - 32 - 32; // screen padding + card padding + inner padding

  // +1 for the "next candle" placeholder column
  const candleCount = candles.length + 1;
  const candleWidth = Math.floor((chartWidth - CANDLE_GAP * (candleCount - 1)) / candleCount);

  // Global price range across all candles
  const { globalMin, globalMax } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const c of candles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    }
    const padding = (max - min) * 0.08;
    return { globalMin: min - padding, globalMax: max + padding };
  }, [candles]);

  const range = globalMax - globalMin || 1;

  // Convert price value to Y coordinate (top = high price)
  const toY = (price: number) =>
    CHART_HEIGHT - ((price - globalMin) / range) * CHART_HEIGHT;

  // Price scale labels (3 horizontal lines)
  const priceLabels = [globalMax, (globalMax + globalMin) / 2, globalMin];

  // Last candle info for prediction arrow
  const lastCandle = candles[candles.length - 1];
  const predictedY = revealed
    ? correctAnswer === 'up'
      ? toY(lastCandle.high * 1.02)
      : toY(lastCandle.low * 0.98)
    : null;

  return (
    <View style={styles.chartWrapper}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        {priceLabels.map((price, i) => (
          <Text key={i} style={styles.yLabel}>
            {price >= 1000
              ? `${(price / 1000).toFixed(1)}k`
              : price.toFixed(0)}
          </Text>
        ))}
      </View>

      {/* Chart area */}
      <View style={[styles.chartArea, { height: CHART_HEIGHT }]}>
        {/* Horizontal grid lines */}
        {priceLabels.map((_, i) => (
          <View
            key={i}
            style={[
              styles.gridLine,
              { top: (i / (priceLabels.length - 1)) * CHART_HEIGHT },
            ]}
          />
        ))}

        {/* Candles */}
        {candles.map((candle, i) => {
          const isGreen = candle.close >= candle.open;
          const color = isGreen ? '#26A65B' : '#F85149';
          const glowColor = isGreen ? 'rgba(38,166,91,0.3)' : 'rgba(248,81,73,0.3)';

          const bodyTop = toY(Math.max(candle.open, candle.close));
          const bodyBottom = toY(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(bodyBottom - bodyTop, 2);

          const wickTop = toY(candle.high);
          const wickBottom = toY(candle.low);

          const x = i * (candleWidth + CANDLE_GAP);
          const isLast = i === candles.length - 1;

          return (
            <View
              key={i}
              style={[
                styles.candleWrapper,
                { left: x, width: candleWidth },
              ]}
            >
              {/* Upper wick */}
              <View
                style={[
                  styles.wick,
                  {
                    top: wickTop,
                    height: Math.max(bodyTop - wickTop, 0),
                    left: candleWidth / 2 - WICK_WIDTH / 2,
                    backgroundColor: color,
                  },
                ]}
              />

              {/* Candle body */}
              <View
                style={[
                  styles.candleBody,
                  {
                    top: bodyTop,
                    height: bodyHeight,
                    backgroundColor: color,
                    shadowColor: glowColor,
                    shadowOpacity: isLast ? 0.6 : 0,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              />

              {/* Lower wick */}
              <View
                style={[
                  styles.wick,
                  {
                    top: bodyTop + bodyHeight,
                    height: Math.max(wickBottom - (bodyTop + bodyHeight), 0),
                    left: candleWidth / 2 - WICK_WIDTH / 2,
                    backgroundColor: color,
                  },
                ]}
              />


            </View>
          );
        })}

        {/* Next candle placeholder — always visible, position neutral (center) */}
        <View
          style={[
            styles.candleWrapper,
            {
              left: candles.length * (candleWidth + CANDLE_GAP),
              width: candleWidth,
            },
          ]}
        >
          {!revealed ? (
            // Dashed empty box in the middle of chart = "unknown next candle"
            <View
              style={[
                styles.nextCandlePlaceholder,
                {
                  top: CHART_HEIGHT * 0.25,
                  height: CHART_HEIGHT * 0.5,
                },
              ]}
            >
              <Text style={styles.nextCandleQ}>?</Text>
            </View>
          ) : (
            // Revealed: show direction arrow
            <Animated.View
              entering={ZoomIn.duration(300)}
              style={[
                styles.nextCandlePlaceholder,
                {
                  top: CHART_HEIGHT * 0.25,
                  height: CHART_HEIGHT * 0.5,
                  borderColor: correctAnswer === 'up' ? '#26A65B' : '#F85149',
                  backgroundColor: correctAnswer === 'up'
                    ? 'rgba(38,166,91,0.12)'
                    : 'rgba(248,81,73,0.12)',
                },
              ]}
            >
              <Text style={styles.nextCandleQ}>
                {correctAnswer === 'up' ? '📈' : '📉'}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────

interface PricePredictionStepViewProps {
  step: PricePredictionStep;
  onAnswer: (isCorrect: boolean) => void;
}

export function PricePredictionStepView({ step, onAnswer }: PricePredictionStepViewProps) {
  const [timeLeft, setTimeLeft] = useState(8);
  const [selected, setSelected] = useState<'up' | 'down' | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Timer progress bar (1 → 0)
  const timerProgress = useSharedValue(1);
  const timerBarStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%`,
  }));

  useEffect(() => {
    timerProgress.value = withTiming(0, {
      duration: 8000,
      easing: Easing.linear,
    });
  }, []);

  // Countdown
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
    if (revealed) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(direction);
    setRevealed(true);
  }, [revealed]);

  const handleContinue = () => {
    if (timedOut) return onAnswer(false);
    onAnswer(selected === step.correctAnswer);
  };

  const isCorrect = selected === step.correctAnswer;
  const feedbackColor = isCorrect ? '#39FF14' : '#F85149';
  const timerColor = timeLeft <= 3 ? '#F85149' : timeLeft <= 5 ? '#FFA500' : '#39FF14';

  return (
    <View style={styles.container}>
      {/* Question */}
      <Animated.Text entering={FadeInDown.duration(300)} style={styles.question}>
        {step.question}
      </Animated.Text>

      {/* Timer bar */}
      {!revealed && (
        <View style={styles.timerContainer}>
          <View style={styles.timerTrack}>
            <Animated.View
              style={[styles.timerFill, { backgroundColor: timerColor }, timerBarStyle]}
            />
          </View>
          <Text style={[styles.timerText, timeLeft <= 3 && styles.timerUrgent]}>
            {timeLeft}s
          </Text>
        </View>
      )}

      {/* Candlestick chart */}
      <Animated.View
        entering={FadeInUp.delay(100).duration(400)}
        style={styles.chartContainer}
      >
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#26A65B' }]} />
            <Text style={styles.legendText}>Haussier</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F85149' }]} />
            <Text style={styles.legendText}>Baissier</Text>
          </View>
          <Text style={styles.legendText}>  |  Prochain = ?</Text>
        </View>

        <CandlestickChart
          candles={step.candles}
          revealed={revealed}
          correctAnswer={step.correctAnswer}
        />
      </Animated.View>

      {/* Prediction buttons */}
      {!revealed && (
        <Animated.View entering={FadeInUp.delay(200)} style={styles.buttonRow}>
          <Pressable
            style={[styles.predictionButton, styles.upButton]}
            onPress={() => handleSelect('up')}
          >
            <Text style={styles.upDownEmoji}>📈</Text>
            <Text style={[styles.predictionButtonText, { color: '#26A65B' }]}>Hausse</Text>
          </Pressable>
          <Pressable
            style={[styles.predictionButton, styles.downButton]}
            onPress={() => handleSelect('down')}
          >
            <Text style={styles.upDownEmoji}>📉</Text>
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
              <Text style={styles.correctAnswer}>
                Réponse : {step.correctAnswer === 'up' ? '📈 Hausse' : '📉 Baisse'}
              </Text>
            </Animated.View>
          ) : (
            <Animated.View
              entering={ZoomIn.duration(300)}
              style={[styles.resultCard, { borderColor: feedbackColor }]}
            >
              <Icon name={isCorrect ? 'check' : 'x'} size={28} color={feedbackColor} />
              <Text style={[styles.resultText, { color: feedbackColor }]}>
                {isCorrect ? 'Bonne lecture !' : 'Mauvaise prédiction'}
              </Text>
              {!isCorrect && (
                <Text style={styles.correctAnswer}>
                  Réponse attendue : {step.correctAnswer === 'up' ? '📈 Hausse' : '📉 Baisse'}
                </Text>
              )}
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
    fontSize: 17,
    fontWeight: '700',
    color: '#E6EDF3',
    lineHeight: 26,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#21262D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    fontWeight: '700',
    color: '#8B949E',
    width: 26,
    textAlign: 'right',
  },
  timerUrgent: {
    color: '#F85149',
  },
  chartContainer: {
    backgroundColor: '#0D1117',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#21262D',
    gap: 10,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#484F58',
  },
  chartWrapper: {
    flexDirection: 'row',
    gap: 6,
  },
  yAxis: {
    width: 32,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  yLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    color: '#484F58',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#21262D',
  },
  candleWrapper: {
    position: 'absolute',
    top: 0,
    height: CHART_HEIGHT,
  },
  wick: {
    position: 'absolute',
    width: WICK_WIDTH,
  },
  candleBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 1,
  },
  nextCandlePlaceholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#484F58',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(139,148,158,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCandleQ: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    fontWeight: '700',
    color: '#8B949E',
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
  upDownEmoji: {
    fontSize: 20,
  },
  upButton: {
    backgroundColor: 'rgba(38, 166, 91, 0.08)',
    borderColor: 'rgba(38, 166, 91, 0.4)',
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
