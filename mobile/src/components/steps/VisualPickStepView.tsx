import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { VisualPickStep, Hotspot } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 48;
const IMAGE_HEIGHT = IMAGE_WIDTH * 0.6; // 5:3 aspect ratio

interface VisualPickStepViewProps {
  step: VisualPickStep;
  onComplete: (isCorrect: boolean) => void;
}

type GameState = 'playing' | 'answered';

/**
 * VisualPickStepView - Tap on correct area of an image (Chart Analyzer)
 */
export function VisualPickStepView({ step, onComplete }: VisualPickStepViewProps) {
  const [gameState, setGameState] = useState<GameState>('playing');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);

  // Pulse animation for hotspots
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withSpring(1.1, { damping: 2 }),
        withSpring(1, { damping: 2 })
      ),
      -1,
      true
    );
  }, []);

  const handleHotspotPress = useCallback(async (hotspot: Hotspot) => {
    if (gameState !== 'playing') return;

    setSelectedHotspot(hotspot);
    const correct = hotspot.id === step.correctHotspotId;
    setIsCorrect(correct);
    setGameState('answered');

    if (correct) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Delay before completing
    setTimeout(() => {
      onComplete(correct);
    }, 2500);
  }, [gameState, step.correctHotspotId, onComplete]);

  const getHotspotStyle = (hotspot: Hotspot): any[] => {
    const radius = hotspot.radius || 8;
    const baseStyle = {
      position: 'absolute' as const,
      left: `${hotspot.x - radius}%` as any,
      top: `${hotspot.y - radius}%` as any,
      width: `${radius * 2}%` as any,
      height: `${radius * 2}%` as any,
    };

    if (gameState === 'answered') {
      if (hotspot.id === step.correctHotspotId) {
        return [styles.hotspot, styles.hotspotCorrect, baseStyle];
      }
      if (hotspot.id === selectedHotspot?.id) {
        return [styles.hotspot, styles.hotspotIncorrect, baseStyle];
      }
      return [styles.hotspot, styles.hotspotDimmed, baseStyle];
    }

    return [styles.hotspot, baseStyle];
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Mindy Message */}
      {step.mindyMessage && (
        <Animated.View entering={FadeIn.duration(300)}>
          <MindyMessage
            message={step.mindyMessage}
            mood={gameState === 'answered' ? (isCorrect ? 'hype' : 'roast') : 'thinking'}
          />
        </Animated.View>
      )}

      {/* Title & Instructions */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.instruction}>{step.instruction}</Text>
      </Animated.View>

      {/* Image with Hotspots */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(200)}
        style={styles.imageContainer}
      >
        <Image
          source={{ uri: step.imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />

        {/* Hotspot overlay */}
        <View style={styles.hotspotOverlay}>
          {step.hotspots.map((hotspot: Hotspot) => (
            <Pressable
              key={hotspot.id}
              style={getHotspotStyle(hotspot)}
              onPress={() => handleHotspotPress(hotspot)}
              disabled={gameState !== 'playing'}
            >
              {gameState === 'playing' ? (
                <Animated.View style={[styles.hotspotInner, pulseStyle]}>
                  <Text style={styles.hotspotLabel}>{hotspot.label}</Text>
                </Animated.View>
              ) : (
                <View style={styles.hotspotInner}>
                  {hotspot.id === step.correctHotspotId && (
                    <Icon name="check" size={16} color="#39FF14" />
                  )}
                  {hotspot.id === selectedHotspot?.id && hotspot.id !== step.correctHotspotId && (
                    <Icon name="x" size={16} color="#F85149" />
                  )}
                  <Text style={styles.hotspotLabelSmall}>{hotspot.label}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Result & Explanation */}
      {gameState === 'answered' && (
        <Animated.View entering={ZoomIn.duration(300)} style={styles.resultContainer}>
          <View style={[styles.resultBadge, isCorrect ? styles.resultCorrect : styles.resultIncorrect]}>
            <View style={styles.resultRow}>
              <Icon name={isCorrect ? 'check' : 'x'} size={18} color={isCorrect ? '#39FF14' : '#F85149'} />
              <Text style={styles.resultText}>
                {isCorrect ? 'Correct!' : 'Not quite'}
              </Text>
            </View>
          </View>
          <Text style={styles.explanation}>{step.explanation}</Text>
        </Animated.View>
      )}

      {/* Hint for playing state */}
      {gameState === 'playing' && (
        <View style={styles.hintContainer}>
          <Icon name="target" size={16} color="#8B949E" />
          <Text style={styles.hintText}>
            Tap on the area you think is correct
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  instruction: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#161B22',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#30363D',
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hotspotOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  hotspot: {
    borderRadius: 100,
    backgroundColor: 'rgba(88, 166, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#58A6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotspotCorrect: {
    backgroundColor: 'rgba(57, 255, 20, 0.3)',
    borderColor: '#39FF14',
  },
  hotspotIncorrect: {
    backgroundColor: 'rgba(248, 81, 73, 0.3)',
    borderColor: '#F85149',
  },
  hotspotDimmed: {
    opacity: 0.4,
  },
  hotspotInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotspotLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#E6EDF3',
    textAlign: 'center',
  },
  hotspotLabelSmall: {
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    color: '#E6EDF3',
    textAlign: 'center',
  },
  hotspotIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  resultContainer: {
    gap: 12,
    alignItems: 'center',
  },
  resultBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resultCorrect: {
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
  },
  resultIncorrect: {
    backgroundColor: 'rgba(248, 81, 73, 0.2)',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  explanation: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  hintContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  hintText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#484F58',
  },
});
