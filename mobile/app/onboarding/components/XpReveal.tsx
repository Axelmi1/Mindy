import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface Props { xp: number; }

/** Compteur XP qui monte + barre qui se remplit. */
export function XpReveal({ xp }: Props) {
  const [shown, setShown] = useState(0);
  const width = useSharedValue(0);

  useEffect(() => {
    // Animation simple du compteur (JS interval) — pas critique.
    let v = 0;
    const step = Math.max(1, Math.round(xp / 20));
    const id = setInterval(() => {
      v = Math.min(xp, v + step);
      setShown(v);
      if (v >= xp) clearInterval(id);
    }, 40);
    width.value = withTiming(100, { duration: 900 });
    return () => clearInterval(id);
  }, [xp]);

  const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <Animated.View entering={FadeIn} style={styles.box}>
      <Text style={styles.xp}>+{shown} XP</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
      <Text style={styles.caption}>Niveau 1 — tu démarres fort 🔥</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 12, paddingVertical: 12 },
  xp: { fontFamily: 'JetBrainsMono', fontSize: 40, fontWeight: '700', color: '#FFD700' },
  track: { width: '100%', height: 10, backgroundColor: '#30363D', borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#39FF14', borderRadius: 5 },
  caption: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E' },
});
