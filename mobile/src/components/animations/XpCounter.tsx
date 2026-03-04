import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

interface XpCounterProps {
  /** Target XP value to count to */
  value: number;
  /** Starting value (default 0) */
  from?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Prefix text */
  prefix?: string;
  /** Whether to show + sign */
  showPlus?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Called when animation completes */
  onComplete?: () => void;
}

const SIZES = {
  small: { value: 16, label: 10 },
  medium: { value: 24, label: 12 },
  large: { value: 36, label: 14 },
};

/**
 * XpCounter - Animated count-up XP display
 */
export function XpCounter({
  value,
  from = 0,
  duration = 1500,
  prefix = '',
  showPlus = false,
  size = 'medium',
  onComplete,
}: XpCounterProps) {
  const [displayValue, setDisplayValue] = useState(from);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in and scale
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 10 })
    );

    // Count up animation
    const startTime = Date.now();
    const diff = value - from;

    const updateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + diff * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        // Bounce on completion
        scale.value = withSequence(
          withSpring(1.3, { damping: 5 }),
          withSpring(1, { damping: 8 })
        );
        onComplete?.();
      }
    };

    requestAnimationFrame(updateValue);
  }, [value, from, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const { value: valueSize, label: labelSize } = SIZES[size];
  const displayText = showPlus && displayValue > 0 ? `+${displayValue}` : `${displayValue}`;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={[styles.prefix, { fontSize: labelSize }]}>{prefix}</Text>
      <Text style={[styles.value, { fontSize: valueSize }]}>
        {displayText}
      </Text>
      <Text style={[styles.label, { fontSize: labelSize }]}>XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  prefix: {
    fontFamily: 'JetBrainsMono',
    color: '#8B949E',
  },
  value: {
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
    color: '#FFD700',
  },
  label: {
    fontFamily: 'JetBrainsMono',
    fontWeight: '600',
    color: '#FFD700',
  },
});

export default XpCounter;
