/**
 * OfflineBanner — shows a pill at top of screen when user is offline.
 * Auto-hides when connectivity is restored.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  visible: boolean;
  stale?: boolean;
}

export function OfflineBanner({ visible, stale = false }: Props) {
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);
  const prevVisible = useRef(false);

  useEffect(() => {
    if (visible !== prevVisible.current) {
      prevVisible.current = visible;
      if (visible) {
        opacity.value = withTiming(1, { duration: 200 });
        translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      } else {
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(-60, { duration: 200 });
      }
    }
  }, [visible, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && translateY.value <= -59) return null;

  return (
    <Animated.View style={[styles.container, style]}>
      <View style={styles.pill}>
        <Text style={styles.dot}>{stale ? '🟡' : '🔴'}</Text>
        <Text style={styles.text}>
          {stale
            ? 'Données mises en cache (réseau lent)'
            : 'Mode hors-ligne — données en cache'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    paddingTop: 8,
    pointerEvents: 'none',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dot: {
    fontSize: 12,
  },
  text: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#C9D1D9',
  },
});
