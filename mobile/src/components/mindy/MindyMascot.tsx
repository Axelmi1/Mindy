import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, LinearGradient, Stop, Defs } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { NeutralFace } from './moods/NeutralFace';
import { HypeFace } from './moods/HypeFace';
import { RoastFace } from './moods/RoastFace';
import { ThinkingFace } from './moods/ThinkingFace';

export type MindyMood = 'neutral' | 'hype' | 'roast' | 'thinking';

interface Props {
  mood?: MindyMood;
  size?: number;
  animated?: boolean;
  style?: ViewStyle;
}

const MOOD_COLORS: Record<MindyMood, { start: string; end: string; glow: string }> = {
  neutral:  { start: '#7cff5a', end: '#1fa80a', glow: 'rgba(57,255,20,0.4)' },
  hype:     { start: '#a8ff8f', end: '#2ade0a', glow: 'rgba(57,255,20,0.65)' },
  roast:    { start: '#ff9c6b', end: '#d14e0a', glow: 'rgba(255,107,53,0.55)' },
  thinking: { start: '#8ec6ff', end: '#2570d1', glow: 'rgba(88,166,255,0.55)' },
};

export function MindyMascot({ mood = 'neutral', size = 120, animated = true, style }: Props) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
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
  }, [animated, mood]);

  const wrapperStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const colors = MOOD_COLORS[mood];

  return (
    <View style={[{ width: size, height: (size * 210) / 200 }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, wrapperStyle]}>
        <Svg
          viewBox="0 0 200 210"
          width="100%"
          height="100%"
          style={{ shadowColor: colors.glow.replace(/rgba?\([^,]+,[^,]+,[^,]+,[^)]+\)/, colors.glow) }}
        >
          <Defs>
            <LinearGradient id={`mindy-body-${mood}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.start} />
              <Stop offset="1" stopColor={colors.end} />
            </LinearGradient>
          </Defs>
          <Path
            d="M42,100 C 28,90 28,62 55,58 C 55,33 85,25 98,42 C 108,18 148,22 150,50 C 178,55 185,85 170,102 C 185,118 175,148 150,150 C 145,170 108,175 100,158 C 90,175 65,168 62,150 C 38,148 25,115 42,100 Z"
            fill={`url(#mindy-body-${mood})`}
            stroke="#0D1117"
            strokeWidth="2.8"
          />
          <Path d="M100,38 Q 96,105 100,155" stroke="#0D1117" strokeWidth="1.8" fill="none" opacity="0.5" />
          <Path d="M58,72 Q 72,82 58,92" stroke="#0D1117" strokeWidth="1.5" fill="none" opacity="0.4" />
          <Path d="M142,72 Q 128,82 142,92" stroke="#0D1117" strokeWidth="1.5" fill="none" opacity="0.4" />
          <Path d="M50,118 Q 68,132 50,142" stroke="#0D1117" strokeWidth="1.5" fill="none" opacity="0.4" />
          <Path d="M150,118 Q 132,132 150,142" stroke="#0D1117" strokeWidth="1.5" fill="none" opacity="0.4" />
          {mood === 'neutral' && <NeutralFace />}
          {mood === 'hype' && <HypeFace />}
          {mood === 'roast' && <RoastFace />}
          {mood === 'thinking' && <ThinkingFace />}
        </Svg>
      </Animated.View>
    </View>
  );
}
