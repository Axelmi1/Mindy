import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { NewsImpactStep } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon, type IconName } from '../ui/Icon';

interface NewsImpactStepViewProps {
  step: NewsImpactStep;
  onAnswer: (isCorrect: boolean) => void;
}

const IMPACT_OPTIONS: { value: 'bullish' | 'bearish' | 'neutral'; label: string; icon: IconName; color: string }[] = [
  { value: 'bullish', label: 'Bullish', icon: 'trending-up', color: '#39FF14' },
  { value: 'bearish', label: 'Bearish', icon: 'trending-down', color: '#F85149' },
  { value: 'neutral', label: 'Neutre', icon: 'minus', color: '#8B949E' },
];

export function NewsImpactStepView({ step, onAnswer }: NewsImpactStepViewProps) {
  const [selected, setSelected] = useState<'bullish' | 'bearish' | 'neutral' | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = useCallback(async (impact: 'bullish' | 'bearish' | 'neutral') => {
    if (revealed) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(impact);
    setRevealed(true);
  }, [revealed]);

  const handleContinue = () => {
    onAnswer(selected === step.correctImpact);
  };

  const isCorrect = selected === step.correctImpact;

  return (
    <View style={styles.container}>
      {/* Breaking news card */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.newsCard}>
        <View style={styles.newsHeader}>
          <View style={styles.breakingBadge}>
            <Text style={styles.breakingText}>BREAKING</Text>
          </View>
          <Text style={styles.newsSource}>{step.source}</Text>
          <Text style={styles.newsDate}>{step.date}</Text>
        </View>
        <Text style={styles.headline}>{step.headline}</Text>
      </Animated.View>

      {/* Question */}
      <Animated.Text entering={FadeInDown.delay(200)} style={styles.question}>
        Quel impact sur les marchés ?
      </Animated.Text>

      {/* Impact buttons */}
      {!revealed && (
        <Animated.View entering={FadeInUp.delay(300)} style={styles.optionsRow}>
          {IMPACT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.optionButton, { borderColor: `${opt.color}44` }]}
              onPress={() => handleSelect(opt.value)}
            >
              <Icon name={opt.icon} size={28} color={opt.color} />
              <Text style={[styles.optionLabel, { color: opt.color }]}>{opt.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Result */}
      {revealed && (
        <>
          <Animated.View entering={ZoomIn.duration(300)} style={styles.resultRow}>
            {IMPACT_OPTIONS.map((opt) => {
              const isUserChoice = opt.value === selected;
              const isAnswer = opt.value === step.correctImpact;
              let borderColor = '#21262D';
              let bgColor = '#161B22';
              let opacity = 0.4;

              if (isAnswer) {
                borderColor = 'rgba(57, 255, 20, 0.6)';
                bgColor = 'rgba(57, 255, 20, 0.08)';
                opacity = 1;
              } else if (isUserChoice && !isAnswer) {
                borderColor = 'rgba(248, 81, 73, 0.6)';
                bgColor = 'rgba(248, 81, 73, 0.08)';
                opacity = 1;
              }

              return (
                <View
                  key={opt.value}
                  style={[styles.resultOption, { borderColor, backgroundColor: bgColor, opacity }]}
                >
                  <Icon name={opt.icon} size={24} color={opt.color} />
                  <Text style={[styles.optionLabel, { color: opt.color }]}>{opt.label}</Text>
                  {isAnswer && (
                    <View style={styles.checkBadge}>
                      <Icon name="check" size={12} color="#39FF14" />
                    </View>
                  )}
                  {isUserChoice && !isAnswer && (
                    <View style={styles.xBadge}>
                      <Icon name="x" size={12} color="#F85149" />
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>

          <Animated.Text entering={FadeIn.delay(200)} style={styles.explanation}>
            {step.explanation}
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(300)}>
            <MindyMessage
              message={step.mindyMessage}
              mood={isCorrect ? 'hype' : 'thinking'}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400)}>
            <Pressable
              style={[styles.continueButton, {
                backgroundColor: isCorrect ? '#39FF14' : '#F85149',
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
  newsCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#30363D',
    gap: 12,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakingBadge: {
    backgroundColor: '#F85149',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  breakingText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  newsSource: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#58A6FF',
    flex: 1,
  },
  newsDate: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#484F58',
  },
  headline: {
    fontFamily: 'Inter',
    fontSize: 19,
    fontWeight: '700',
    color: '#E6EDF3',
    lineHeight: 28,
  },
  question: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#8B949E',
    fontWeight: '500',
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: '#161B22',
  },
  optionLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
  },
  resultRow: {
    flexDirection: 'row',
    gap: 10,
  },
  resultOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(248, 81, 73, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
