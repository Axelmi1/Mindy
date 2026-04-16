import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { TimelineBuilderStep } from '@mindy/shared';
type TimelineEvent = TimelineBuilderStep['events'][number];
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

interface TimelineBuilderStepViewProps {
  step: TimelineBuilderStep;
  onAnswer: (isCorrect: boolean) => void;
}

type GameState = 'playing' | 'checked';

export function TimelineBuilderStepView({ step, onAnswer }: TimelineBuilderStepViewProps) {
  // Correct order: events sorted by year (as given in the array order)
  const correctEventOrder = useMemo(() => step.events.map((e) => e.id), [step.events]);

  // Shuffle events for the card pool
  const shuffledEvents = useMemo(() => {
    const shuffled = [...step.events];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [step.events]);

  const [placedEvents, setPlacedEvents] = useState<TimelineEvent[]>([]);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [results, setResults] = useState<Record<string, boolean>>({});

  const remainingEvents = shuffledEvents.filter(
    (e) => !placedEvents.some((p) => p.id === e.id)
  );

  const allPlaced = placedEvents.length === step.events.length;

  const handleEventPress = async (event: TimelineEvent) => {
    if (gameState !== 'playing') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlacedEvents((prev) => [...prev, event]);
  };

  const handleRemoveEvent = async (eventId: string) => {
    if (gameState !== 'playing') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlacedEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleCheck = async () => {
    const newResults: Record<string, boolean> = {};
    let allCorrect = true;

    placedEvents.forEach((event, idx) => {
      const isCorrect = event.id === correctEventOrder[idx];
      newResults[event.id] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });

    setResults(newResults);
    setGameState('checked');

    if (allCorrect) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const isAllCorrect = gameState === 'checked' && Object.values(results).every(Boolean);

  return (
    <View style={styles.container}>
      {step.mindyMessage && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <MindyMessage message={step.mindyMessage} mood="thinking" />
        </Animated.View>
      )}

      {/* Title */}
      <Animated.View entering={FadeInDown.delay(100).duration(300)}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>Place les événements dans l'ordre chronologique</Text>
      </Animated.View>

      {/* Timeline (placed events) */}
      <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.timelineContainer}>
        <View style={styles.timelineLine} />

        {placedEvents.length === 0 && (
          <View style={styles.emptyTimeline}>
            <Icon name="clock" size={20} color="#30363D" />
            <Text style={styles.emptyTimelineText}>Tape les événements dans l'ordre</Text>
          </View>
        )}

        {placedEvents.map((event, idx) => {
          const result = results[event.id];
          const borderColor =
            gameState === 'checked'
              ? result ? '#39FF14' : '#F85149'
              : '#39FF14';

          return (
            <Animated.View
              key={event.id}
              entering={ZoomIn.duration(250)}
              layout={Layout.springify()}
            >
              <Pressable
                style={[styles.timelineCard, { borderColor }]}
                onPress={() => handleRemoveEvent(event.id)}
                disabled={gameState !== 'playing'}
              >
                <View style={[styles.timelineDot, { backgroundColor: borderColor }]} />
                <Text style={styles.timelineEmoji}>{event.emoji}</Text>
                <View style={styles.timelineCardContent}>
                  <Text style={styles.timelineLabel} numberOfLines={1} ellipsizeMode="tail">{event.label}</Text>
                  {gameState === 'checked' && (
                    <Text style={[styles.timelineYear, { color: borderColor }]}>
                      {event.year}
                    </Text>
                  )}
                </View>
                <View style={styles.timelinePosition}>
                  <Text style={[styles.positionText, gameState === 'checked' && { color: borderColor }]}>
                    {idx + 1}
                  </Text>
                </View>
                {gameState === 'checked' && (
                  <Animated.View entering={ZoomIn.duration(200)}>
                    <Icon
                      name={result ? 'check' : 'x'}
                      size={14}
                      color={result ? '#39FF14' : '#F85149'}
                    />
                  </Animated.View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Remaining cards pool */}
      {remainingEvents.length > 0 && (
        <View style={styles.poolSection}>
          <Text style={styles.poolTitle}>Événements disponibles</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.poolScroll}>
            {remainingEvents.map((event, idx) => (
              <Animated.View
                key={event.id}
                entering={FadeInUp.delay(idx * 50).duration(250)}
              >
                <Pressable
                  style={styles.poolCard}
                  onPress={() => handleEventPress(event)}
                  disabled={gameState !== 'playing'}
                >
                  <Text style={styles.poolEmoji}>{event.emoji}</Text>
                  <Text style={styles.poolLabel} numberOfLines={2} ellipsizeMode="tail">{event.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Explanation */}
      {gameState === 'checked' && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.explanationCard}>
          <Text style={styles.explanationText}>{step.explanation}</Text>
        </Animated.View>
      )}

      {/* Check / Continue */}
      {gameState === 'playing' ? (
        allPlaced && (
          <Animated.View entering={FadeInUp.delay(100)}>
            <Pressable style={styles.checkButton} onPress={handleCheck}>
              <Text style={styles.checkButtonText}>Vérifier l'ordre</Text>
              <Icon name="check" size={18} color="#0D1117" />
            </Pressable>
          </Animated.View>
        )
      ) : (
        <Animated.View entering={FadeInUp.delay(200)}>
          <Pressable
            style={[styles.continueButton, { backgroundColor: isAllCorrect ? '#39FF14' : '#F85149' }]}
            onPress={() => onAnswer(isAllCorrect)}
          >
            <Text style={styles.continueButtonText}>Continuer</Text>
            <Icon name="arrow-right" size={18} color="#0D1117" />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    marginTop: 4,
  },
  timelineContainer: {
    position: 'relative',
    gap: 8,
    paddingLeft: 16,
    minHeight: 80,
  },
  timelineLine: {
    position: 'absolute',
    left: 4,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#30363D',
    borderRadius: 1,
  },
  emptyTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#21262D',
    borderStyle: 'dashed',
    backgroundColor: '#0D1117',
  },
  emptyTimelineText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#30363D',
    fontStyle: 'italic',
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#161B22',
  },
  timelineDot: {
    position: 'absolute',
    left: -20,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineEmoji: {
    fontSize: 20,
  },
  timelineCardContent: {
    flex: 1,
    gap: 2,
  },
  timelineLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  timelineYear: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
  },
  timelinePosition: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(139, 148, 158, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#8B949E',
  },
  poolSection: {
    gap: 10,
  },
  poolTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#8B949E',
  },
  poolScroll: {
    gap: 8,
    paddingRight: 16,
  },
  poolCard: {
    backgroundColor: '#161B22',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#30363D',
    alignItems: 'center',
    gap: 6,
    width: 100,
    minHeight: 80,
    justifyContent: 'center',
  },
  poolEmoji: {
    fontSize: 24,
  },
  poolLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#E6EDF3',
    textAlign: 'center',
    lineHeight: 16,
  },
  explanationCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  explanationText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#C9D1D9',
    lineHeight: 22,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#39FF14',
  },
  checkButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
});
