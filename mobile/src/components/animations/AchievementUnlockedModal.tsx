import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
import { Icon, IconName } from '../ui/Icon';
import { Achievement } from '@/api/client';
import { getRarityColor, getCategoryIcon } from '@/hooks/useAchievements';

interface AchievementUnlockedModalProps {
  achievement: Achievement | null;
  onDismiss: () => void;
  visible: boolean;
}

/**
 * AchievementUnlockedModal - Full screen achievement unlock celebration
 */
export function AchievementUnlockedModal({
  achievement,
  onDismiss,
  visible,
}: AchievementUnlockedModalProps) {
  const badgeScale = useSharedValue(0);
  const badgeRotate = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && achievement) {
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
  }, [visible, achievement]);

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

  if (!visible || !achievement) return null;

  const rarityColor = getRarityColor(achievement.rarity);
  const iconName = getCategoryIcon(achievement.category) as IconName;

  // Determine confetti count based on rarity
  const confettiCount = {
    COMMON: 40,
    UNCOMMON: 60,
    RARE: 80,
    EPIC: 100,
    LEGENDARY: 150,
  }[achievement.rarity] || 60;

  return (
    <Animated.View
      style={styles.overlay}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      {/* Background confetti */}
      <Confetti count={confettiCount} />

      {/* Content */}
      <View style={styles.content}>
        {/* Achievement badge */}
        <Animated.View style={[styles.badgeContainer, badgeAnimatedStyle]}>
          <View style={[styles.badge, { borderColor: rarityColor }]}>
            <View style={[styles.badgeGlow, { backgroundColor: rarityColor }]} />
            <Icon name={iconName} size={40} color={rarityColor} />
          </View>
        </Animated.View>

        {/* Congratulations text */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.title}>ACHIEVEMENT UNLOCKED!</Text>
          <Text style={[styles.achievementName, { color: rarityColor }]}>
            {achievement.name}
          </Text>
          <Text style={styles.description}>
            {achievement.description}
          </Text>

          {/* XP Reward */}
          <View style={styles.xpReward}>
            <Icon name="zap" size={20} color="#FFD700" />
            <Text style={styles.xpText}>+{achievement.xpReward} XP</Text>
          </View>

          {/* Rarity badge */}
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '30' }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {achievement.rarity}
            </Text>
          </View>
        </Animated.View>

        {/* Dismiss button */}
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Awesome!</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
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
    opacity: 0.2,
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#8B949E',
    letterSpacing: 2,
  },
  achievementName: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    maxWidth: 280,
  },
  xpReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  xpText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  rarityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  rarityText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
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

export default AchievementUnlockedModal;
