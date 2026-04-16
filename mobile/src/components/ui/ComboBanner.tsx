import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';

interface ComboBannerProps {
  comboCount: number;
  comboMultiplier: number;
  bonusXp: number;
  visible: boolean;
}

const COMBO_COLORS: Record<number, string> = {
  3: '#39FF14',
  4: '#00CFFF',
  5: '#FF6B35',
};

const COMBO_LABELS: Record<number, string> = {
  3: 'COMBO ×1.5',
  4: 'COMBO ×1.5',
  5: 'MEGA COMBO ×2',
};

const COMBO_EMOJIS: Record<number, string> = {
  3: '🔥',
  4: '⚡',
  5: '💥',
};

/**
 * ComboBanner — shown when a user chains lessons for bonus XP
 * Appears on lesson completion when comboCount ≥ 3
 */
export function ComboBanner({ comboCount, comboMultiplier, bonusXp, visible }: ComboBannerProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1.0, { damping: 12 }),
      );
    } else {
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible || comboCount < 3) return null;

  const tier = comboCount >= 5 ? 5 : comboCount >= 4 ? 4 : 3;
  const color = COMBO_COLORS[tier] ?? '#39FF14';
  const label = COMBO_LABELS[tier] ?? `COMBO ×${comboMultiplier}`;
  const emoji = COMBO_EMOJIS[tier] ?? '🔥';

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(12)}
      exiting={FadeOut.duration(300)}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.container, { borderColor: color }, animStyle]}>
        {/* Glow background */}
        <View style={[styles.glow, { backgroundColor: color }]} />

        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.textBlock}>
          <Text style={[styles.label, { color }]}>{label}</Text>
          <Text style={styles.subtitle}>
            {comboCount} leçons d'affilée · +{bonusXp} XP bonus
          </Text>
        </View>
        <Text style={[styles.multiplierBadge, { color, borderColor: color }]}>
          ×{comboMultiplier}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(13,17,23,0.95)',
    overflow: 'hidden',
    minWidth: 280,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.06,
  },
  emoji: {
    fontSize: 28,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontFamily: 'JetBrainsMono',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  multiplierBadge: {
    fontFamily: 'JetBrainsMono',
    fontSize: 20,
    fontWeight: '800',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
