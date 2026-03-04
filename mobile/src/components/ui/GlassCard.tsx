import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Intensity of the blur effect (0-100) */
  intensity?: number;
  /** Tint of the blur */
  tint?: 'light' | 'dark' | 'default';
  /** Whether to show animated gradient border */
  animatedBorder?: boolean;
  /** Border color theme */
  borderColor?: 'primary' | 'gold' | 'blue' | 'purple' | 'none';
}

const BORDER_COLORS: Record<string, readonly [string, string, string]> = {
  primary: ['rgba(57, 255, 20, 0.5)', 'rgba(57, 255, 20, 0.1)', 'rgba(57, 255, 20, 0.3)'] as const,
  gold: ['rgba(255, 215, 0, 0.5)', 'rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.3)'] as const,
  blue: ['rgba(88, 166, 255, 0.5)', 'rgba(88, 166, 255, 0.1)', 'rgba(88, 166, 255, 0.3)'] as const,
  purple: ['rgba(163, 113, 247, 0.5)', 'rgba(163, 113, 247, 0.1)', 'rgba(163, 113, 247, 0.3)'] as const,
  none: ['transparent', 'transparent', 'transparent'] as const,
};

/**
 * GlassCard - Apple-style liquid glass effect card
 */
export function GlassCard({
  children,
  style,
  intensity = 20,
  tint = 'dark',
  animatedBorder = false,
  borderColor = 'none',
}: GlassCardProps) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (animatedBorder) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [animatedBorder]);

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const colors = BORDER_COLORS[borderColor];

  return (
    <View style={[styles.container, style]}>
      {/* Animated gradient border */}
      {borderColor !== 'none' && (
        <Animated.View style={[styles.gradientBorder, animatedBorder && animatedGradientStyle]}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Glass background */}
      <View style={styles.glassContainer}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidFallback]} />
        )}

        {/* Inner glow effect */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.02)',
            'rgba(0, 0, 0, 0.05)',
          ] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.innerGlow]}
        />

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
  },
  glassContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(22, 27, 34, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  androidFallback: {
    backgroundColor: 'rgba(22, 27, 34, 0.9)',
  },
  innerGlow: {
    borderRadius: 16,
  },
  content: {
    padding: 16,
  },
});

export default GlassCard;
