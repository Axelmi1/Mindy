import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Icon } from '../ui/Icon';

interface StreakFireProps {
  /** Current streak count */
  streak: number;
  /** Size of the fire icon */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the count */
  showCount?: boolean;
  /** Whether streak is at risk */
  atRisk?: boolean;
}

const SIZES = {
  small: { icon: 20, text: 12 },
  medium: { icon: 32, text: 16 },
  large: { icon: 48, text: 24 },
};

/**
 * StreakFire - Animated fire icon with streak count
 */
export function StreakFire({
  streak,
  size = 'medium',
  showCount = true,
  atRisk = false,
}: StreakFireProps) {
  const pulse = useSharedValue(1);

  // Pulse animation
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withSpring(1.15, { damping: 3, stiffness: 80 }),
        withSpring(1, { damping: 3, stiffness: 80 })
      ),
      -1,
      true
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const { icon: iconSize, text: textSize } = SIZES[size];
  const color = atRisk ? '#FFA657' : '#FF6B35';

  return (
    <View style={styles.container}>
      {/* Fire icon */}
      <Animated.View style={animatedIconStyle}>
        <Icon name="flame" size={iconSize} color={color} />
      </Animated.View>

      {/* Streak count */}
      {showCount && streak > 0 && (
        <Text style={[styles.count, { fontSize: textSize }]}>
          {streak}
        </Text>
      )}

      {/* At risk indicator */}
      {atRisk && (
        <View style={styles.riskBadge}>
          <Text style={styles.riskText}>!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
    color: '#E6EDF3',
    marginTop: 4,
  },
  riskBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F85149',
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default StreakFire;
