/**
 * GoalCelebrationModal
 *
 * Displays a full-screen celebration overlay when the user hits their
 * daily XP goal. Features animated confetti, a glowing trophy, and
 * a motivational message. Auto-dismisses after 3.5 s.
 *
 * Usage:
 *   <GoalCelebrationModal
 *     visible={shouldCelebrate}
 *     goal={100}
 *     onDismiss={() => markCelebrated()}
 *   />
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Icon } from './Icon';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Confetti Particle ───────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#39FF14', '#FFD700', '#00BFFF', '#FF6B6B',
  '#C0C0C0', '#FF8C00', '#7B68EE', '#00FA9A',
];

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
}

function ConfettiPiece({ particle }: { particle: ConfettiParticle }) {
  const translateY = useSharedValue(-40);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 80;

    opacity.value = withDelay(particle.delay, withTiming(1, { duration: 100 }));
    translateY.value = withDelay(
      particle.delay,
      withTiming(SCREEN_H + 60, {
        duration: 2800 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      }),
    );
    translateX.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(drift, { duration: 800 }),
        withTiming(-drift / 2, { duration: 800 }),
        withTiming(drift / 3, { duration: 800 }),
      ),
    );
    rotate.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(360, { duration: 900 + Math.random() * 600 }),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: particle.x,
          top: 0,
          width: particle.size,
          height: particle.size * (Math.random() > 0.5 ? 0.5 : 1),
          backgroundColor: particle.color,
          borderRadius: Math.random() > 0.5 ? particle.size / 2 : 2,
        },
        style,
      ]}
    />
  );
}

// ─── Trophy Pulse ────────────────────────────────────────────────────────────

function TrophyIcon() {
  const scale = useSharedValue(0.5);
  const glow = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 180 });
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.3, { duration: 900 }),
      ),
      -1,
      true,
    );
  }, []);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.6,
    transform: [{ scale: 1 + glow.value * 0.4 }],
  }));

  return (
    <View style={styles.trophyWrapper}>
      {/* Glow ring */}
      <Animated.View style={[styles.glowRing, glowStyle]} />
      <Animated.View style={[styles.trophyBg, trophyStyle]}>
        <Icon name="trophy" size={52} color="#FFD700" />
      </Animated.View>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const CONFETTI_COUNT = 50;

const MESSAGES = [
  'Objectif atteint ! 🔥',
  'Tu gères grave !',
  'Discipline = liberté',
  'Un pas de plus 💪',
  'Champion du jour !',
];

interface GoalCelebrationModalProps {
  visible: boolean;
  goal: number;
  onDismiss: () => void;
}

export function GoalCelebrationModal({
  visible,
  goal,
  onDismiss,
}: GoalCelebrationModalProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build confetti once
  const particles: ConfettiParticle[] = React.useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * SCREEN_W,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 10,
        delay: Math.random() * 600,
      })),
    [],
  );

  const message = React.useMemo(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    [visible],
  );

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, 3500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      statusBarTranslucent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        {/* Blur backdrop */}
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={40}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBackdrop]} />
        )}

        {/* Confetti rain */}
        {particles.map((p) => (
          <ConfettiPiece key={p.id} particle={p} />
        ))}

        {/* Card */}
        <Animated.View
          entering={ZoomIn.springify().damping(14).stiffness(160)}
          exiting={FadeOut.duration(200)}
          style={styles.card}
        >
          <LinearGradient
            colors={['#1A2400', '#0F1A00', '#0D1117'] as const}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.cardTopAccent} />

          <TrophyIcon />

          <Animated.Text
            entering={FadeIn.delay(300).duration(400)}
            style={styles.bigText}
          >
            {message}
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(450).duration(400)}
            style={styles.subText}
          >
            Tu as atteint ton objectif de{' '}
            <Text style={styles.xpHighlight}>{goal} XP</Text> aujourd'hui
          </Animated.Text>

          <Animated.View
            entering={FadeIn.delay(600).duration(300)}
            style={styles.goalChip}
          >
            <Icon name="zap" size={14} color="#39FF14" />
            <Text style={styles.goalChipText}>+{goal} XP</Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(700).duration(300)}>
            <Pressable style={styles.continueBtn} onPress={onDismiss}>
              <LinearGradient
                colors={['#39FF14', '#2BD410'] as const}
                style={styles.continueBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.continueBtnText}>Continuer</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  androidBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 28,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#39FF14',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#39FF14',
  },
  trophyWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    height: 96,
    marginBottom: 4,
  },
  glowRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFD700',
  },
  trophyBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,215,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  bigText: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '800',
    color: '#E6EDF3',
    textAlign: 'center',
  },
  subText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },
  xpHighlight: {
    color: '#39FF14',
    fontWeight: '700',
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(57,255,20,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  goalChipText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#39FF14',
  },
  continueBtn: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueBtnGradient: {
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 12,
  },
  continueBtnText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#0D1117',
  },
});
