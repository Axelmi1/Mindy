import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Confetti colors
const COLORS = [
  '#39FF14', // Green
  '#FFD700', // Gold
  '#58A6FF', // Blue
  '#F85149', // Red
  '#A371F7', // Purple
  '#FFA657', // Orange
];

interface ConfettiPieceProps {
  index: number;
  delay: number;
  onComplete?: () => void;
  isLast: boolean;
}

function ConfettiPiece({ index, delay, onComplete, isLast }: ConfettiPieceProps) {
  const progress = useSharedValue(0);

  // Random properties for this piece
  const startX = useMemo(() => Math.random() * SCREEN_WIDTH, []);
  const endX = useMemo(() => startX + (Math.random() - 0.5) * 200, [startX]);
  const rotation = useMemo(() => Math.random() * 720 - 360, []);
  const size = useMemo(() => 8 + Math.random() * 8, []);
  const color = useMemo(() => COLORS[Math.floor(Math.random() * COLORS.length)], []);
  const isSquare = useMemo(() => Math.random() > 0.5, []);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished && isLast && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [-50, SCREEN_HEIGHT + 50]);
    const translateX = interpolate(progress.value, [0, 1], [startX, endX]);
    const rotate = interpolate(progress.value, [0, 1], [0, rotation]);
    const opacity = interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 1, 1, 0]);
    const scale = interpolate(progress.value, [0, 0.2, 1], [0, 1, 0.5]);

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotate}deg` },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        animatedStyle,
        {
          width: size,
          height: isSquare ? size : size * 0.4,
          backgroundColor: color,
          borderRadius: isSquare ? 2 : size,
        },
      ]}
    />
  );
}

interface ConfettiProps {
  /** Number of confetti pieces */
  count?: number;
  /** Called when animation completes */
  onComplete?: () => void;
  /** Whether to show confetti */
  active?: boolean;
}

/**
 * Confetti - Celebration animation with falling colored pieces
 */
export function Confetti({ count = 50, onComplete, active = true }: ConfettiProps) {
  if (!active) return null;

  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      index: i,
      delay: Math.random() * 500,
    }));
  }, [count]);

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece, i) => (
        <ConfettiPiece
          key={piece.index}
          index={piece.index}
          delay={piece.delay}
          onComplete={onComplete}
          isLast={i === pieces.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 1000,
  },
  piece: {
    position: 'absolute',
  },
});

export default Confetti;
