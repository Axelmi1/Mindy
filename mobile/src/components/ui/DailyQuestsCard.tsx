/**
 * DailyQuestsCard
 *
 * Les 3 quêtes du jour (à la Duolingo) : progression en temps réel,
 * récompense XP à réclamer quand la quête est complétée.
 * Se recharge à chaque focus de l'écran (retour de leçon, etc.).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  interpolateColor,
  Easing,
  ZoomIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Confetti } from '@/components/animations';
import { questsApi, DailyQuest } from '@/api/client';

interface DailyQuestsCardProps {
  userId: string;
  /** Appelé après une réclamation réussie (pour rafraîchir l'XP affichée ailleurs). */
  onXpClaimed?: (xpAwarded: number) => void;
}

export function DailyQuestsCard({ userId, onXpClaimed }: DailyQuestsCardProps) {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [claimingKey, setClaimingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await questsApi.getToday(userId);
      if (res.data) setQuests(res.data);
    } catch {
      // silencieux : la carte ne s'affiche pas si l'API échoue
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleClaim = async (quest: DailyQuest) => {
    if (claimingKey) return;
    setClaimingKey(quest.key);
    try {
      const res = await questsApi.claim(userId, quest.key);
      if (res.data) {
        setQuests((prev) =>
          prev.map((q) => (q.key === quest.key ? { ...q, claimed: true } : q)),
        );
        onXpClaimed?.(res.data.xpAwarded);
      }
    } catch {
      // déjà réclamée / pas complétée : on resynchronise
      load();
    } finally {
      setClaimingKey(null);
    }
  };

  if (quests.length === 0) return null;

  const completedCount = quests.filter((q) => q.claimed).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Quêtes du jour</Text>
        <Text style={styles.counter}>
          {completedCount}/{quests.length}
        </Text>
      </View>

      {quests.map((quest) => (
        <QuestRow
          key={quest.key}
          quest={quest}
          claiming={claimingKey === quest.key}
          disabled={claimingKey !== null}
          onClaim={handleClaim}
        />
      ))}
    </View>
  );
}

interface QuestRowProps {
  quest: DailyQuest;
  claiming: boolean;
  disabled: boolean;
  onClaim: (quest: DailyQuest) => void;
}

function QuestRow({ quest, claiming, disabled, onClaim }: QuestRowProps) {
  const ratio = quest.target > 0 ? quest.progress / quest.target : 0;
  const claimable = quest.isCompleted && !quest.claimed;

  const progressSV = useSharedValue(ratio);
  const doneSV = useSharedValue(quest.isCompleted ? 1 : 0);
  const buttonScale = useSharedValue(1);
  const [burst, setBurst] = useState(false);
  const prevClaimed = useRef(quest.claimed);

  useEffect(() => {
    progressSV.value = withTiming(ratio, { duration: 400, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest.progress, quest.target]);

  useEffect(() => {
    doneSV.value = withTiming(quest.isCompleted ? 1 : 0, { duration: 300 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest.isCompleted]);

  useEffect(() => {
    if (quest.claimed && !prevClaimed.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      buttonScale.value = withSequence(
        withTiming(1.15, { duration: 120 }),
        withSpring(1, { damping: 8, stiffness: 200 }),
      );
      setBurst(true);
    }
    prevClaimed.current = quest.claimed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest.claimed]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressSV.value * 100}%`,
    backgroundColor: interpolateColor(doneSV.value, [0, 1], ['#58A6FF', '#39FF14']),
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  return (
    <View style={styles.questRow}>
      <Text style={styles.questEmoji}>{quest.emoji}</Text>

      <View style={styles.questBody}>
        <Text style={styles.questTitle}>{quest.title}</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
        <Text style={styles.progressLabel}>
          {quest.progress}/{quest.target}
        </Text>
      </View>

      <View style={styles.claimSlot}>
        {burst && <Confetti count={16} onComplete={() => setBurst(false)} />}

        {quest.claimed ? (
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.claimedBadge}>
            <Text style={styles.claimedText}>✓</Text>
          </Animated.View>
        ) : claimable ? (
          <Animated.View exiting={FadeOut.duration(150)} style={buttonAnimStyle}>
            <TouchableOpacity
              style={styles.claimButton}
              onPress={() => onClaim(quest)}
              disabled={disabled}
              activeOpacity={0.8}
            >
              {claiming ? (
                <ActivityIndicator size="small" color="#0D1117" />
              ) : (
                <Text style={styles.claimButtonText}>+{quest.xpReward} XP</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardText}>+{quest.xpReward} XP</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E6EDF3',
    fontFamily: 'JetBrainsMono-Bold',
  },
  counter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#39FF14',
    fontFamily: 'JetBrainsMono-Bold',
  },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  questEmoji: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  questBody: {
    flex: 1,
  },
  questTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#E6EDF3',
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#21262D',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#58A6FF',
  },
  progressLabel: {
    fontSize: 11,
    color: '#8B949E',
    marginTop: 3,
  },
  claimSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardBadge: {
    backgroundColor: '#21262D',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B949E',
    fontFamily: 'JetBrainsMono-Bold',
  },
  claimButton: {
    backgroundColor: '#39FF14',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#39FF14',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D1117',
    fontFamily: 'JetBrainsMono-Bold',
  },
  claimedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimedText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#39FF14',
  },
});
