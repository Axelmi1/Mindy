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

interface DomainCardProps {
  /** Domain name */
  name: string;
  /** Number of lessons in this domain */
  lessonsCount: number;
  /** Accent color for the domain */
  accentColor: string;
  /** Press handler */
  onPress: () => void;
}

// ============================================================================
// Domain Icons
// ============================================================================

const domainIcons: Record<string, IconName> = {
  CRYPTO: 'bitcoin',
  FINANCE: 'dollar',
};

// ============================================================================
// DomainCard Component
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * DomainCard - Category selector card
 * 
 * Allows users to browse lessons by domain (Crypto/Finance).
 */
export function DomainCard({
  name,
  lessonsCount,
  accentColor,
  onPress,
}: DomainCardProps) {
  // Animation value for press effect
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const icon = domainIcons[name] || 'book';

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {/* Background gradient effect */}
      <View
        style={[
          styles.gradientOverlay,
          { backgroundColor: accentColor }
        ]}
      />

      {/* Icon */}
      <View style={styles.iconContainer}>
        <Icon name={icon} size={24} color={accentColor} />
      </View>

      {/* Domain name */}
      <Text style={[styles.name, { color: accentColor }]}>
        {name}
      </Text>

      {/* Lessons count */}
      <Text style={styles.lessonsCount}>
        {lessonsCount} lessons
      </Text>

      {/* Arrow indicator */}
      <View style={[styles.arrowContainer, { borderColor: accentColor }]}>
        <Text style={[styles.arrow, { color: accentColor }]}>→</Text>
      </View>
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
    minHeight: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.1,
    transform: [{ translateX: 20 }, { translateY: -20 }],
  },
  iconContainer: {
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  name: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  lessonsCount: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#21262D',
  },
  arrow: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DomainCard;

