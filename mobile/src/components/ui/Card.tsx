import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// ============================================================================
// Types
// ============================================================================

interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Optional press handler */
  onPress?: () => void;
  /** Card style variant */
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  /** Custom padding */
  padding?: number;
  /** Additional styles */
  style?: ViewStyle;
  /** Disable press animation */
  disableAnimation?: boolean;
}

// ============================================================================
// Card Component
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Card - Base card component for Bento grid layouts
 * 
 * Provides consistent styling with press animations.
 */
export function Card({
  children,
  onPress,
  variant = 'default',
  padding = 16,
  style,
  disableAnimation = false,
}: CardProps) {
  // Animation value for press effect
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disableAnimation && onPress) {
      scale.value = withSpring(0.98, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    if (!disableAnimation && onPress) {
      scale.value = withSpring(1, { damping: 15 });
    }
  };

  // Get variant styles
  const variantStyles = getVariantStyles(variant);

  // If no press handler, render as a simple View
  if (!onPress) {
    return (
      <View style={[styles.base, variantStyles, { padding }, style]}>
        {children}
      </View>
    );
  }

  return (
    <AnimatedPressable
      style={[styles.base, variantStyles, { padding }, style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {children}
    </AnimatedPressable>
  );
}

// ============================================================================
// Variant Styles
// ============================================================================

function getVariantStyles(variant: CardProps['variant']): ViewStyle {
  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: '#161B22',
        borderWidth: 1,
        borderColor: '#30363D',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      };
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#30363D',
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderWidth: 0,
      };
    case 'default':
    default:
      return {
        backgroundColor: '#161B22',
        borderWidth: 1,
        borderColor: '#30363D',
      };
  }
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default Card;

