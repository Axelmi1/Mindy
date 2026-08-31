/**
 * DailyQuestsCard
 *
 * Les 3 quêtes du jour (à la Duolingo) : progression en temps réel,
 * récompense XP à réclamer quand la quête est complétée.
 * Se recharge à chaque focus de l'écran (retour de leçon, etc.).
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
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

      {quests.map((quest) => {
        const ratio = quest.target > 0 ? quest.progress / quest.target : 0;
        const claimable = quest.isCompleted && !quest.claimed;

        return (
          <View key={quest.key} style={styles.questRow}>
            <Text style={styles.questEmoji}>{quest.emoji}</Text>

            <View style={styles.questBody}>
              <Text style={styles.questTitle}>{quest.title}</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    quest.isCompleted && styles.progressFillDone,
                    { width: `${Math.round(ratio * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {quest.progress}/{quest.target}
              </Text>
            </View>

            {quest.claimed ? (
              <View style={styles.claimedBadge}>
                <Text style={styles.claimedText}>✓</Text>
              </View>
            ) : claimable ? (
              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => handleClaim(quest)}
                disabled={claimingKey !== null}
                activeOpacity={0.8}
              >
                <Text style={styles.claimButtonText}>+{quest.xpReward} XP</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardText}>+{quest.xpReward} XP</Text>
              </View>
            )}
          </View>
        );
      })}
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
  progressFillDone: {
    backgroundColor: '#39FF14',
  },
  progressLabel: {
    fontSize: 11,
    color: '#8B949E',
    marginTop: 3,
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
