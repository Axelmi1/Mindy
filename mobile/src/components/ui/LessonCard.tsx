import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Icon } from './Icon';

interface LessonCardProps {
  id: string;
  title: string;
  domain: 'CRYPTO' | 'FINANCE';
  xpReward: number;
  stepsCount: number;
  completedSteps?: number;
  isCompleted?: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * LessonCard - Card for displaying a lesson in a list
 */
export function LessonCard({
  title,
  domain,
  xpReward,
  stepsCount,
  completedSteps = 0,
  isCompleted = false,
  onPress,
}: LessonCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const domainColor = domain === 'CRYPTO' ? '#39FF14' : '#58A6FF';
  const progress = stepsCount > 0 ? Math.round((completedSteps / stepsCount) * 100) : 0;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle, isCompleted && styles.containerCompleted]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {/* Status indicator */}
      <View style={[styles.statusBar, { backgroundColor: isCompleted ? '#39FF14' : domainColor + '40' }]} />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.domainBadge, { backgroundColor: domainColor + '20' }]}>
            <Text style={[styles.domainText, { color: domainColor }]}>{domain}</Text>
          </View>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Icon name="check" size={12} color="#39FF14" />
              <Text style={styles.completedBadgeText}>DONE</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.metaText}>{stepsCount} steps</Text>
          <Text style={styles.xpText}>+{xpReward} XP</Text>
          {completedSteps > 0 && !isCompleted && (
            <Text style={[styles.progressText, { color: domainColor }]}>{progress}%</Text>
          )}
        </View>
      </View>

      {/* Arrow indicator */}
      <View style={styles.arrowContainer}>
        <Text style={[styles.arrow, { color: domainColor }]}>→</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  containerCompleted: {
    borderColor: '#39FF14',
    opacity: 0.8,
  },
  statusBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  domainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  domainText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '700',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#39FF14',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
  },
  xpText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#FFD700',
  },
  progressText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
  },
  arrowContainer: {
    paddingRight: 16,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default LessonCard;
