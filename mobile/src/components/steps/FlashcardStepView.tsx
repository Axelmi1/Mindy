import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { FlashcardStep } from '@mindy/shared';
import { Icon } from '../ui/Icon';

interface FlashcardStepViewProps {
  step: FlashcardStep;
  onContinue: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function FlashcardStepView({ step, onContinue }: FlashcardStepViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotation = useSharedValue(0);

  const handleFlip = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = isFlipped ? 0 : 1;
    rotation.value = withTiming(toValue, {
      duration: 500,
      easing: Easing.inOut(Easing.cubic),
    });
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
    };
  });

  return (
    <View style={styles.container}>
      {/* Category badge */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.categoryBadge}>
        <Icon name="book" size={12} color="#58A6FF" />
        <Text style={styles.categoryText}>{step.category}</Text>
      </Animated.View>

      {/* Flip instruction */}
      <Animated.Text entering={FadeInDown.delay(100)} style={styles.instruction}>
        {isFlipped ? 'Définition' : 'Terme'}
      </Animated.Text>

      {/* Flashcard */}
      <Pressable onPress={handleFlip} style={styles.cardContainer}>
        {/* Front */}
        <Animated.View style={[styles.card, styles.cardFront, frontStyle]}>
          <View style={styles.cardContent}>
            <Text style={styles.frontText}>{step.front}</Text>
            <View style={styles.tapHint}>
              <Icon name="refresh" size={14} color="#484F58" />
              <Text style={styles.tapHintText}>Tape pour retourner</Text>
            </View>
          </View>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
          <View style={styles.cardContent}>
            <Text style={styles.backText}>{step.back}</Text>
            <View style={styles.tapHint}>
              <Icon name="refresh" size={14} color="#484F58" />
              <Text style={styles.tapHintText}>Tape pour retourner</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>

      {/* Continue button (always visible — flashcards are info-like) */}
      <Animated.View entering={FadeInUp.delay(400)}>
        <Pressable style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>J'ai compris</Text>
          <Icon name="arrow-right" size={18} color="#0D1117" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(88, 166, 255, 0.3)',
  },
  categoryText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#58A6FF',
  },
  instruction: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8B949E',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardContainer: {
    width: SCREEN_WIDTH - 64,
    height: 220,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
  },
  cardFront: {
    backgroundColor: '#161B22',
    borderColor: '#39FF14',
  },
  cardBack: {
    backgroundColor: '#0D1117',
    borderColor: '#58A6FF',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  frontText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 22,
    fontWeight: '700',
    color: '#39FF14',
    textAlign: 'center',
  },
  backText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#E6EDF3',
    textAlign: 'center',
    lineHeight: 24,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    bottom: 16,
  },
  tapHintText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#484F58',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#39FF14',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginTop: 8,
  },
  continueButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
});
