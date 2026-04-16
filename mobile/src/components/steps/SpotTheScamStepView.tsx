import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { SpotTheScamStep } from '@mindy/shared';
type ScamCard = SpotTheScamStep['cards'][number];
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

interface SpotTheScamStepViewProps {
  step: SpotTheScamStep;
  onAnswer: (isCorrect: boolean) => void;
}

type GameState = 'playing' | 'correct' | 'incorrect';

const CARD_TYPE_CONFIG = {
  tweet: { icon: 'share' as const, label: '@', bgColor: 'rgba(29, 155, 240, 0.08)' },
  email: { icon: 'bell' as const, label: 'De:', bgColor: 'rgba(234, 179, 8, 0.08)' },
  site: { icon: 'link' as const, label: 'URL:', bgColor: 'rgba(88, 166, 255, 0.08)' },
};

export function SpotTheScamStepView({ step, onAnswer }: SpotTheScamStepViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>('playing');

  const shakeX = useSharedValue(0);

  const scamCard = step.cards.find((c) => c.isScam);

  const handleCardPress = async (card: ScamCard) => {
    if (gameState !== 'playing') return;

    setSelectedId(card.id);

    if (card.isScam) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGameState('correct');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      setGameState('incorrect');
    }
  };

  const getCardStyle = (card: ScamCard) => {
    if (gameState === 'playing') {
      return selectedId === card.id ? styles.cardSelected : styles.cardDefault;
    }
    if (card.isScam) return styles.cardScam;
    if (card.id === selectedId && !card.isScam) return styles.cardWrong;
    return styles.cardDefault;
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <View style={styles.container}>
      {step.mindyMessage && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <MindyMessage message={step.mindyMessage} mood="thinking" />
        </Animated.View>
      )}

      {/* Question */}
      <Animated.View entering={FadeInDown.delay(100).duration(300)}>
        <Text style={styles.question}>{step.question}</Text>
      </Animated.View>

      {/* Cards */}
      <Animated.View style={shakeStyle}>
        <View style={styles.cardsGrid}>
          {step.cards.map((card, idx) => {
            const config = CARD_TYPE_CONFIG[card.type];
            return (
              <Animated.View
                key={card.id}
                entering={FadeInUp.delay(150 + idx * 80).duration(300)}
              >
                <Pressable
                  style={[styles.card, getCardStyle(card)]}
                  onPress={() => handleCardPress(card)}
                  disabled={gameState !== 'playing'}
                >
                  {/* Card header */}
                  <View style={[styles.cardHeader, { backgroundColor: config.bgColor }]}>
                    <Icon name={config.icon} size={14} color="#8B949E" />
                    <Text style={styles.cardSender}>
                      {config.label} {card.sender}
                    </Text>
                    {gameState !== 'playing' && card.isScam && (
                      <Animated.View entering={ZoomIn.duration(200)} style={styles.scamBadge}>
                        <Text style={styles.scamBadgeText}>SCAM</Text>
                      </Animated.View>
                    )}
                  </View>

                  {/* Card content */}
                  <Text style={styles.cardContent}>{card.content}</Text>

                  {/* Red flags on scam card after answer */}
                  {gameState !== 'playing' && card.isScam && card.redFlags && card.redFlags.length > 0 && (
                    <Animated.View entering={FadeInUp.delay(200).duration(300)} style={styles.redFlagsContainer}>
                      <Text style={styles.redFlagsTitle}>Red flags :</Text>
                      {card.redFlags.map((flag, i) => (
                        <View key={i} style={styles.redFlagRow}>
                          <Text style={styles.redFlagIcon}>🚩</Text>
                          <Text style={styles.redFlagText}>{flag}</Text>
                        </View>
                      ))}
                    </Animated.View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {/* Explanation */}
      {gameState !== 'playing' && (
        <Animated.View entering={FadeInUp.delay(300).duration(300)} style={styles.explanationCard}>
          <Text style={styles.explanationText}>{step.explanation}</Text>
        </Animated.View>
      )}

      {/* Continue button */}
      {gameState !== 'playing' && (
        <Animated.View entering={FadeInUp.delay(400)}>
          <Pressable
            style={[
              styles.continueButton,
              { backgroundColor: gameState === 'correct' ? '#39FF14' : '#F85149' },
            ]}
            onPress={() => onAnswer(gameState === 'correct')}
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
  question: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
    lineHeight: 26,
  },
  cardsGrid: {
    gap: 10,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardDefault: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  cardSelected: {
    backgroundColor: '#161B22',
    borderColor: '#58A6FF',
  },
  cardScam: {
    backgroundColor: 'rgba(57, 255, 20, 0.04)',
    borderColor: '#39FF14',
  },
  cardWrong: {
    backgroundColor: 'rgba(248, 81, 73, 0.06)',
    borderColor: '#F85149',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  cardSender: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8B949E',
    flex: 1,
  },
  scamBadge: {
    backgroundColor: '#F85149',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scamBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardContent: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#E6EDF3',
    lineHeight: 20,
    padding: 12,
  },
  redFlagsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },
  redFlagsTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#F85149',
    marginBottom: 2,
  },
  redFlagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  redFlagIcon: {
    fontSize: 12,
  },
  redFlagText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#C9D1D9',
    flex: 1,
    lineHeight: 18,
  },
  explanationCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  explanationText: {
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
  },
  continueButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
});
