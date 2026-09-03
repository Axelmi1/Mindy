import React, { useEffect } from 'react';
import { Image, View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type MindyMood =
  | 'neutral'
  | 'hype'
  | 'roast'
  | 'thinking'
  // humeurs bonus, utilisées pour des points d'intégration spécifiques
  | 'sleepy'
  | 'pro'
  | 'freeze'
  | 'coach';

interface Props {
  mood?: MindyMood;
  size?: number;
  animated?: boolean;
  style?: ViewStyle;
}

const MOOD_IMAGES: Record<MindyMood, number> = {
  neutral: require('../../../assets/mascot/neutre.png'),
  hype: require('../../../assets/mascot/celebration.png'),
  roast: require('../../../assets/mascot/streak.png'),
  thinking: require('../../../assets/mascot/reflexion.png'),
  sleepy: require('../../../assets/mascot/endormi.png'),
  pro: require('../../../assets/mascot/pro.png'),
  freeze: require('../../../assets/mascot/freeze.png'),
  coach: require('../../../assets/mascot/coach.png'),
};

const MOOD_GLOW: Record<MindyMood, string> = {
  neutral: 'rgba(57,255,20,0.35)',
  hype: 'rgba(57,255,20,0.6)',
  roast: 'rgba(255,107,53,0.55)',
  thinking: 'rgba(88,166,255,0.5)',
  sleepy: 'rgba(139,148,158,0.3)',
  pro: 'rgba(255,215,0,0.5)',
  freeze: 'rgba(88,198,255,0.5)',
  coach: 'rgba(88,166,255,0.5)',
};

export function MindyMascot({ mood = 'neutral', size = 120, animated = true, style }: Props) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(animated ? 0.6 : 1);
  const opacity = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;

    scale.value = withSpring(1, { damping: 9, stiffness: 140, mass: 0.6 });
    opacity.value = withTiming(1, { duration: 200 });

    const duration = mood === 'hype' ? 400 : mood === 'thinking' ? 1000 : 1750;
    const amplitude = mood === 'hype' ? -10 : -6;
    translateY.value = withRepeat(
      withSequence(
        withTiming(amplitude, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated, mood]);

  const wrapperStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const glow = MOOD_GLOW[mood];

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            backgroundColor: glow,
            shadowColor: glow,
            shadowOpacity: 0.9,
            shadowRadius: size * 0.35,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
          },
        ]}
      />
      <Animated.View style={wrapperStyle}>
        <Image source={MOOD_IMAGES[mood]} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}
