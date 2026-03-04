import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Confetti } from './Confetti';
import { Icon } from '../ui/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LevelUpCelebrationProps {
  /** New level achieved */
  level: number;
  /** Called when celebration is dismissed */
  onDismiss: () => void;
  /** Whether to show the celebration */
  visible: boolean;
}

/**
 * LevelUpCelebration - Full screen level up celebration modal
 */
export function LevelUpCelebration({ level, onDismiss, visible }: LevelUpCelebrationProps) {
  const badgeScale = useSharedValue(0);
  const badgeRotate = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset rotation to 0 first
      badgeRotate.value = 0;

      // Badge entrance animation - bounce in
      badgeScale.value = withDelay(
        300,
        withSequence(
          withSpring(1.15, { damping: 6, stiffness: 200 }),
          withSpring(1, { damping: 10, stiffness: 150 })
        )
      );

      // Text fade in
      textOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));

      // Button fade in
      buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));

      // Auto dismiss after 5 seconds
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    } else {
      badgeScale.value = 0;
      badgeRotate.value = 0;
      textOpacity.value = 0;
      buttonOpacity.value = 0;
    }
  }, [visible]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRotate.value}deg` },
    ],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={styles.overlay}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      {/* Background confetti */}
      <Confetti count={80} />

      {/* Content */}
      <View style={styles.content}>
        {/* Level badge */}
        <Animated.View style={[styles.badgeContainer, badgeAnimatedStyle]}>
          <View style={styles.badge}>
            <View style={styles.badgeGlow} />
            <Icon name="trophy" size={40} color="#FFD700" />
            <Text style={styles.levelNumber}>{level}</Text>
          </View>
        </Animated.View>

        {/* Congratulations text */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.title}>LEVEL UP!</Text>
          <Text style={styles.subtitle}>
            You've reached level {level}
          </Text>
          <Text style={styles.encouragement}>
            Keep crushing those lessons!
          </Text>
        </Animated.View>

        {/* Dismiss button */}
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 17, 23, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  badgeContainer: {
    marginBottom: 32,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#161B22',
    borderWidth: 3,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFD700',
    opacity: 0.2,
  },
  levelNumber: {
    fontFamily: 'JetBrainsMono',
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
    marginTop: 4,
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'JetBrainsMono',
    fontSize: 36,
    fontWeight: '700',
    color: '#39FF14',
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#E6EDF3',
  },
  encouragement: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 40,
  },
  button: {
    backgroundColor: '#39FF14',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
});

export default LevelUpCelebration;
