import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// ============================================================================
// Types
// ============================================================================

interface ProgressBarProps {
  /** Progress value (0-100) */
  progress: number;
  /** Style variant */
  variant?: 'default' | 'terminal' | 'neon';
  /** Height of the progress bar */
  height?: number;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Custom color */
  color?: string;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Loading text (for terminal variant) */
  loadingText?: string;
}

// ============================================================================
// ProgressBar Component
// ============================================================================

/**
 * ProgressBar - Animated progress indicator
 * 
 * Multiple variants for different contexts:
 * - default: Simple progress bar
 * - terminal: ASCII-style progress bar
 * - neon: Glowing progress bar
 */
export function ProgressBar({
  progress,
  variant = 'default',
  height = 8,
  showPercentage = false,
  color = '#39FF14',
  animationDuration = 500,
  loadingText = 'LOADING...',
}: ProgressBarProps) {
  // Animation value
  const animatedProgress = useSharedValue(0);

  // Animate progress on change
  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animationDuration]);

  // Animated style for the fill
  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  // Terminal variant
  if (variant === 'terminal') {
    const barWidth = 20;
    const filledBlocks = Math.round((progress / 100) * barWidth);
    const emptyBlocks = barWidth - filledBlocks;
    const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

    return (
      <View style={styles.terminalContainer}>
        <Text style={[styles.terminalBar, { color }]}>
          [{progressBar}]
        </Text>
        {showPercentage && (
          <Text style={[styles.terminalPercentage, { color }]}>
            {Math.round(progress)}%
          </Text>
        )}
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  // Neon variant
  if (variant === 'neon') {
    return (
      <View style={styles.container}>
        <View style={[styles.track, styles.neonTrack, { height }]}>
          <Animated.View
            style={[
              styles.fill,
              styles.neonFill,
              { backgroundColor: color, height },
              fillStyle,
            ]}
          />
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.neonGlow,
              { backgroundColor: color, height: height * 2 },
              fillStyle,
            ]}
          />
        </View>
        {showPercentage && (
          <Text style={[styles.percentage, { color }]}>
            {Math.round(progress)}%
          </Text>
        )}
      </View>
    );
  }

  // Default variant
  return (
    <View style={styles.container}>
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: color, borderRadius: height / 2 },
            fillStyle,
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={[styles.percentage, { color }]}>
          {Math.round(progress)}%
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    backgroundColor: '#21262D',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  percentage: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  // Terminal variant styles
  terminalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  terminalBar: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    letterSpacing: -1,
  },
  terminalPercentage: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#484F58',
    letterSpacing: 1,
  },
  // Neon variant styles
  neonTrack: {
    borderRadius: 4,
    position: 'relative',
  },
  neonFill: {
    borderRadius: 4,
    position: 'relative',
    zIndex: 2,
  },
  neonGlow: {
    position: 'absolute',
    top: -4,
    left: 0,
    opacity: 0.3,
    borderRadius: 4,
    zIndex: 1,
  },
});

export default ProgressBar;

