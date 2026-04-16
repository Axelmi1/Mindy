import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { ConnectDotsStep, ConnectDotsPair } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';
import { Icon } from '../ui/Icon';

interface ConnectDotsStepViewProps {
  step: ConnectDotsStep;
  onAnswer: (isCorrect: boolean) => void;
}

type GameState = 'playing' | 'checked';

interface Position {
  x: number;
  y: number;
  height: number;
}

export function ConnectDotsStepView({ step, onAnswer }: ConnectDotsStepViewProps) {
  // Shuffle definitions
  const shuffledDefIndices = useMemo(() => {
    const indices = step.pairs.map((_: ConnectDotsPair, i: number) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [step.pairs]);

  const [connections, setConnections] = useState<Record<number, number>>({}); // termIdx -> shuffledDefPosition
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [results, setResults] = useState<Record<number, boolean>>({});

  const allConnected = Object.keys(connections).length === step.pairs.length;

  const handleTermPress = async (termIdx: number) => {
    if (gameState !== 'playing') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If already connected, disconnect
    if (connections[termIdx] !== undefined) {
      const newConns = { ...connections };
      delete newConns[termIdx];
      setConnections(newConns);
      setSelectedTerm(null);
      return;
    }

    setSelectedTerm(termIdx);
  };

  const handleDefPress = async (shuffledPos: number) => {
    if (gameState !== 'playing' || selectedTerm === null) return;

    // Check if this def is already connected
    const existingTerm = Object.entries(connections).find(
      ([_, defPos]) => defPos === shuffledPos
    );
    if (existingTerm) {
      // Disconnect existing
      const newConns = { ...connections };
      delete newConns[Number(existingTerm[0])];
      newConns[selectedTerm] = shuffledPos;
      setConnections(newConns);
    } else {
      setConnections((prev) => ({ ...prev, [selectedTerm]: shuffledPos }));
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTerm(null);
  };

  const handleCheck = async () => {
    const newResults: Record<number, boolean> = {};
    let allCorrect = true;

    Object.entries(connections).forEach(([termIdxStr, shuffledDefPos]) => {
      const termIdx = Number(termIdxStr);
      const actualDefIdx = shuffledDefIndices[shuffledDefPos];
      const isCorrect = termIdx === actualDefIdx;
      newResults[termIdx] = isCorrect;
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

  const getTermStyle = (termIdx: number) => {
    if (gameState === 'checked') {
      return results[termIdx] ? styles.capsuleCorrect : styles.capsuleIncorrect;
    }
    if (selectedTerm === termIdx) return styles.capsuleSelected;
    if (connections[termIdx] !== undefined) return styles.capsuleConnected;
    return styles.capsuleDefault;
  };

  const getDefStyle = (shuffledPos: number) => {
    const connectedTerm = Object.entries(connections).find(([_, dp]) => dp === shuffledPos);
    if (gameState === 'checked' && connectedTerm) {
      return results[Number(connectedTerm[0])] ? styles.capsuleCorrect : styles.capsuleIncorrect;
    }
    if (connectedTerm) return styles.capsuleConnected;
    return styles.capsuleDefault;
  };

  // Get connection number for display
  const getConnectionNumber = (termIdx: number): number | null => {
    if (connections[termIdx] === undefined) return null;
    const sortedTerms = Object.keys(connections).map(Number).sort((a, b) => a - b);
    return sortedTerms.indexOf(termIdx) + 1;
  };

  const getDefConnectionNumber = (shuffledPos: number): number | null => {
    const entry = Object.entries(connections).find(([_, dp]) => dp === shuffledPos);
    if (!entry) return null;
    return getConnectionNumber(Number(entry[0]));
  };

  return (
    <View style={styles.container}>
      {step.mindyMessage && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <MindyMessage message={step.mindyMessage} mood="thinking" />
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(100).duration(300)}>
        <Text style={styles.instruction}>Connecte chaque terme à sa définition</Text>
      </Animated.View>

      {/* Two columns */}
      <View style={styles.columnsContainer}>
        {/* Terms (left) */}
        <View style={styles.column}>
          {step.pairs.map((pair, termIdx) => {
            const connNum = getConnectionNumber(termIdx);
            return (
              <Animated.View
                key={termIdx}
                entering={FadeInDown.delay(150 + termIdx * 60).duration(300)}
              >
                <Pressable
                  style={[styles.capsule, getTermStyle(termIdx)]}
                  onPress={() => handleTermPress(termIdx)}
                  disabled={gameState !== 'playing'}
                >
                  {connNum !== null && (
                    <View style={styles.connBadge}>
                      <Text style={styles.connBadgeText}>{connNum}</Text>
                    </View>
                  )}
                  <Text style={styles.capsuleText} numberOfLines={2}>
                    {pair.term}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Connector line visual */}
        <View style={styles.connectorColumn}>
          {step.pairs.map((_, i) => (
            <View key={i} style={styles.connectorDot} />
          ))}
        </View>

        {/* Definitions (right) */}
        <View style={styles.column}>
          {shuffledDefIndices.map((defIdx, shuffledPos) => {
            const connNum = getDefConnectionNumber(shuffledPos);
            return (
              <Animated.View
                key={defIdx}
                entering={FadeInDown.delay(200 + shuffledPos * 60).duration(300)}
              >
                <Pressable
                  style={[styles.capsule, styles.capsuleDef, getDefStyle(shuffledPos)]}
                  onPress={() => handleDefPress(shuffledPos)}
                  disabled={gameState !== 'playing' || selectedTerm === null}
                >
                  {connNum !== null && (
                    <View style={styles.connBadge}>
                      <Text style={styles.connBadgeText}>{connNum}</Text>
                    </View>
                  )}
                  <Text style={styles.capsuleTextSmall} numberOfLines={3}>
                    {step.pairs[defIdx].definition}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Helper text */}
      {gameState === 'playing' && selectedTerm !== null && (
        <Animated.View entering={FadeInUp.duration(200)}>
          <Text style={styles.helperText}>
            Maintenant tape la définition correspondante
          </Text>
        </Animated.View>
      )}

      {/* Check / Continue button */}
      {gameState === 'playing' ? (
        allConnected && (
          <Animated.View entering={FadeInUp.delay(100)}>
            <Pressable style={styles.checkButton} onPress={handleCheck}>
              <Text style={styles.checkButtonText}>Vérifier</Text>
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
  instruction: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
    lineHeight: 26,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  connectorColumn: {
    width: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  connectorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30363D',
  },
  capsule: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 52,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  capsuleDef: {},
  capsuleDefault: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
  },
  capsuleSelected: {
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
    borderColor: '#58A6FF',
  },
  capsuleConnected: {
    backgroundColor: 'rgba(57, 255, 20, 0.06)',
    borderColor: '#39FF14',
  },
  capsuleCorrect: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: '#39FF14',
  },
  capsuleIncorrect: {
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderColor: '#F85149',
  },
  capsuleText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
    flex: 1,
  },
  capsuleTextSmall: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#C9D1D9',
    flex: 1,
    lineHeight: 18,
  },
  connBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#39FF14',
  },
  helperText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#58A6FF',
    textAlign: 'center',
    fontStyle: 'italic',
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
