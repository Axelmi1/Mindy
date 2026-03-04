import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Icon, IconName } from './Icon';

// ============================================================================
// Types
// ============================================================================

interface StatCardProps {
  /** Label text (e.g., "XP", "STREAK") */
  label: string;
  /** Main value to display */
  value: string;
  /** Optional sublabel (e.g., "Level 5") */
  sublabel?: string;
  /** Icon name from Icon component */
  icon: IconName;
  /** Accent color for the icon glow */
  accentColor?: string;
  /** Press handler */
  onPress?: () => void;
}

// ============================================================================
// StatCard Component
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * StatCard - Bento-style stat display card
 * 
 * Displays a single statistic with an icon, value, and optional sublabel.
 * Features a subtle press animation and glow effect.
 */
export function StatCard({
  label,
  value,
  sublabel,
  icon,
  accentColor = '#39FF14',
  onPress,
}: StatCardProps) {
  // Animation value for press effect
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Icon name={icon} size={28} color={accentColor} />
      </View>

      {/* Value */}
      <Text style={[styles.value, { color: accentColor }]}>
        {value}
      </Text>

      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Sublabel */}
      {sublabel && (
        <Text style={styles.sublabel}>{sublabel}</Text>
      )}

      {/* Accent border indicator */}
      <View 
        style={[
          styles.accentBar, 
          { backgroundColor: accentColor }
        ]} 
      />
    </AnimatedPressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    overflow: 'hidden',
  },
  iconContainer: {
    marginBottom: 8,
  },
  value: {
    fontFamily: 'JetBrainsMono',
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  sublabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#484F58',
    marginTop: 2,
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});

export default StatCard;

