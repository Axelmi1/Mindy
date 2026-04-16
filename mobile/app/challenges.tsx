import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { challengesApi, LessonChallenge } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';

const DOMAIN_COLORS: Record<string, string> = {
  CRYPTO: '#F7931A',
  FINANCE: '#39FF14',
  TRADING: '#00CFFF',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  PENDING:   { label: 'En attente',  color: '#FFD700',  emoji: '⏳' },
  ACCEPTED:  { label: 'Accepté',     color: '#39FF14',  emoji: '⚔️' },
  COMPLETED: { label: 'Terminé',     color: '#58A6FF',  emoji: '🏆' },
  DECLINED:  { label: 'Refusé',      color: '#F85149',  emoji: '❌' },
  EXPIRED:   { label: 'Expiré',      color: '#8B949E',  emoji: '💨' },
};

function ChallengeCard({
  challenge,
  mode,
  userId,
  onRespond,
  index,
}: {
  challenge: LessonChallenge;
  mode: 'received' | 'sent';
  userId: string;
  onRespond: () => void;
  index: number;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRematchLoading, setIsRematchLoading] = useState(false);
  const status = STATUS_CONFIG[challenge.status] ?? STATUS_CONFIG.PENDING;
  const domainColor = DOMAIN_COLORS[challenge.lesson?.domain ?? ''] ?? '#39FF14';

  const opponent = mode === 'received' ? challenge.challenger : challenge.challenged;

  const expiresIn = () => {
    const diff = new Date(challenge.expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expiré';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h restantes` : `${mins}min restantes`;
  };

  const handleRespond = async (responseStatus: 'ACCEPTED' | 'DECLINED') => {
    setIsLoading(true);
    try {
      await challengesApi.respond(challenge.id, userId, responseStatus);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onRespond();
    } catch (err: any) {
      Alert.alert('Erreur', err.message ?? 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAndPlay = async () => {
    setIsLoading(true);
    try {
      await challengesApi.respond(challenge.id, userId, 'ACCEPTED');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      // Navigate to the lesson
      router.push(`/lesson/${challenge.lessonId}`);
    } catch (err: any) {
      Alert.alert('Erreur', err.message ?? 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  const isCompleted = challenge.status === 'COMPLETED';
  const hasWinner = isCompleted && challenge.challengerXp !== null && challenge.challengedXp !== null;
  const challengerWon = hasWinner && (challenge.challengerXp ?? 0) >= (challenge.challengedXp ?? 0);
  const iWon = hasWinner && (
    (mode === 'sent' && challengerWon) || (mode === 'received' && !challengerWon)
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <View style={styles.card}>
        {/* Domain accent */}
        <View style={[styles.cardAccent, { backgroundColor: domainColor }]} />

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.opponentInfo}>
            <View style={[styles.avatar, { borderColor: domainColor }]}>
              <Text style={styles.avatarLetter}>
                {opponent?.username?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.opponentLabel}>
                {mode === 'received' ? 'Défi reçu de' : 'Défi envoyé à'}
              </Text>
              <Text style={styles.opponentName}>@{opponent?.username ?? '—'}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { borderColor: status.color }]}>
            <Text style={styles.statusEmoji}>{status.emoji}</Text>
            <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Lesson info */}
        <View style={styles.lessonInfo}>
          <View style={[styles.domainTag, { backgroundColor: domainColor + '22', borderColor: domainColor }]}>
            <Text style={[styles.domainText, { color: domainColor }]}>
              {challenge.lesson?.domain ?? '—'}
            </Text>
          </View>
          <Text style={styles.lessonTitle} numberOfLines={1}>
            {challenge.lesson?.title ?? 'Leçon inconnue'}
          </Text>
          <Text style={styles.xpReward}>⚡ {challenge.lesson?.xpReward ?? '?'} XP</Text>
        </View>

        {/* Message */}
        {challenge.message && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>💬 "{challenge.message}"</Text>
          </View>
        )}

        {/* Results (completed) */}
        {isCompleted && hasWinner && (
          <View style={styles.resultsRow}>
            <View style={styles.resultItem}>
              <Text style={styles.resultName}>{challenge.challenger?.username}</Text>
              <Text style={[styles.resultXp, challengerWon && styles.resultWinner]}>
                {challenge.challengerXp} XP {challengerWon ? '👑' : ''}
              </Text>
            </View>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.resultItem}>
              <Text style={styles.resultName}>{challenge.challenged?.username}</Text>
              <Text style={[styles.resultXp, !challengerWon && styles.resultWinner]}>
                {challenge.challengedXp} XP {!challengerWon ? '👑' : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Winner banner */}
        {isCompleted && hasWinner && (
          <LinearGradient
            colors={iWon ? ['#39FF14', '#00CFFF'] : ['#F85149', '#FF6B35']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.winnerBanner}
          >
            <Text style={styles.winnerText}>
              {iWon ? '🏆 Tu as gagné !' : '💪 Bien joué quand même !'}
            </Text>
          </LinearGradient>
        )}

        {/* Actions */}
        {challenge.status === 'PENDING' && mode === 'received' && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={handleAcceptAndPlay}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#0D1117" size="small" />
                : <Text style={styles.acceptBtnText}>⚔️ Accepter & Jouer</Text>
              }
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleRespond('DECLINED')}
              disabled={isLoading}
            >
              <Text style={styles.declineBtnText}>Refuser</Text>
            </Pressable>
          </View>
        )}

        {challenge.status === 'ACCEPTED' && challenge.lessonId && (
          <Pressable
            style={[styles.actionBtn, styles.playBtn]}
            onPress={() => router.push(`/lesson/${challenge.lessonId}`)}
          >
            <Text style={styles.playBtnText}>▶ Jouer la leçon</Text>
          </Pressable>
        )}

        {/* Expiry */}
        {(challenge.status === 'PENDING' || challenge.status === 'ACCEPTED') && (
          <Text style={styles.expiry}>⏱ {expiresIn()}</Text>
        )}

        {/* Rematch button — available once challenge is COMPLETED */}
        {challenge.status === 'COMPLETED' && (
          <Pressable
            style={[styles.actionBtn, styles.rematchBtn, isRematchLoading && { opacity: 0.6 }]}
            onPress={async () => {
              setIsRematchLoading(true);
              try {
                await challengesApi.rematch(challenge.id, userId);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Revanche envoyée ! 🔥', 'Ton adversaire a reçu le défi.', [
                  { text: 'OK', onPress: onRespond },
                ]);
              } catch (err: any) {
                Alert.alert('Erreur', err.message ?? 'Impossible d\'envoyer la revanche');
              } finally {
                setIsRematchLoading(false);
              }
            }}
            disabled={isRematchLoading}
          >
            {isRematchLoading
              ? <ActivityIndicator color="#FFD700" size="small" />
              : <Text style={styles.rematchBtnText}>🔥 Revanche !</Text>
            }
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * Challenges Screen — Lesson Challenges with friends
 */
export default function ChallengesScreen() {
  const { userId } = useUser();
  const HISTORY_STATUSES = ['COMPLETED', 'DECLINED', 'EXPIRED'] as const;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [received, setReceived] = useState<LessonChallenge[]>([]);
  const [sent, setSent] = useState<LessonChallenge[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'history'>('received');

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await challengesApi.getForUser(userId);
      if (res.success && res.data) {
        setReceived(res.data.received);
        setSent(res.data.sent);
      }
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const pendingCount = received.filter((c) => c.status === 'PENDING').length;

  // History = COMPLETED/DECLINED/EXPIRED from both sides, deduplicated, sorted by most recent
  const historyList: Array<{ challenge: LessonChallenge; mode: 'received' | 'sent' }> = (() => {
    const seen = new Set<string>();
    const items: Array<{ challenge: LessonChallenge; mode: 'received' | 'sent'; ts: number }> = [];

    for (const c of received) {
      if (HISTORY_STATUSES.includes(c.status as typeof HISTORY_STATUSES[number]) && !seen.has(c.id)) {
        seen.add(c.id);
        items.push({ challenge: c, mode: 'received', ts: new Date(c.updatedAt ?? c.createdAt).getTime() });
      }
    }
    for (const c of sent) {
      if (HISTORY_STATUSES.includes(c.status as typeof HISTORY_STATUSES[number]) && !seen.has(c.id)) {
        seen.add(c.id);
        items.push({ challenge: c, mode: 'sent', ts: new Date(c.updatedAt ?? c.createdAt).getTime() });
      }
    }

    return items
      .sort((a, b) => b.ts - a.ts)
      .map(({ challenge, mode }) => ({ challenge, mode }));
  })();

  // Active challenges (exclude history ones)
  const activeReceived = received.filter(
    (c) => !HISTORY_STATUSES.includes(c.status as typeof HISTORY_STATUSES[number]),
  );
  const activeSent = sent.filter(
    (c) => !HISTORY_STATUSES.includes(c.status as typeof HISTORY_STATUSES[number]),
  );

  const currentList = activeTab === 'received' ? activeReceived : activeSent;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="chevron-left" size={22} color="#C9D1D9" />
        </Pressable>
        <Text style={styles.title}>Défis</Text>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'received' && styles.tabActive]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
            {`Reçus${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
            {`Envoyés (${activeSent.length})`}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            {`Historique${historyList.length > 0 ? ` (${historyList.length})` : ''}`}
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#39FF14" />
        </View>
      ) : activeTab === 'history' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#39FF14" />}
          showsVerticalScrollIndicator={false}
        >
          {historyList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📜</Text>
              <Text style={styles.emptyTitle}>Aucun historique</Text>
              <Text style={styles.emptySubtitle}>
                Tes défis terminés, refusés ou expirés apparaîtront ici.
              </Text>
            </View>
          ) : (
            historyList.map(({ challenge, mode }, i) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                mode={mode}
                userId={userId ?? ''}
                onRespond={loadData}
                index={i}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#39FF14" />}
          showsVerticalScrollIndicator={false}
        >
          {currentList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>⚔️</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'received'
                  ? 'Aucun défi actif reçu'
                  : 'Aucun défi actif envoyé'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'received'
                  ? 'Tes amis peuvent te défier sur une leçon depuis leur écran.'
                  : 'Va sur l\'écran Amis pour défier quelqu\'un.'}
              </Text>
              <Pressable
                style={styles.goToFriendsBtn}
                onPress={() => router.push('/friends')}
              >
                <Text style={styles.goToFriendsBtnText}>Voir mes amis</Text>
              </Pressable>
            </View>
          ) : (
            currentList.map((challenge, i) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                mode={activeTab as 'received' | 'sent'}
                userId={userId ?? ''}
                onRespond={loadData}
                index={i}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#E6EDF3',
  },
  pendingBadge: {
    backgroundColor: '#39FF14',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    color: '#0D1117',
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#21262D',
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#8B949E',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#39FF14',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    overflow: 'hidden',
  },
  cardAccent: {
    height: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  opponentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    backgroundColor: '#21262D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E6EDF3',
    fontFamily: 'JetBrainsMono',
  },
  opponentLabel: {
    fontSize: 11,
    color: '#8B949E',
    fontFamily: 'Inter',
  },
  opponentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
    fontFamily: 'Inter',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusEmoji: {
    fontSize: 12,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono',
    fontWeight: '600',
  },
  lessonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  domainTag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  domainText: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 13,
    color: '#C9D1D9',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  xpReward: {
    fontSize: 12,
    color: '#39FF14',
    fontFamily: 'JetBrainsMono',
    fontWeight: '600',
  },
  messageBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#21262D',
    borderRadius: 8,
    padding: 10,
  },
  messageText: {
    fontSize: 12,
    color: '#8B949E',
    fontFamily: 'Inter',
    fontStyle: 'italic',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  resultItem: {
    alignItems: 'center',
    gap: 4,
  },
  resultName: {
    fontSize: 12,
    color: '#8B949E',
    fontFamily: 'Inter',
  },
  resultXp: {
    fontSize: 16,
    color: '#C9D1D9',
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
  },
  resultWinner: {
    color: '#FFD700',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8B949E',
    fontFamily: 'JetBrainsMono',
  },
  winnerBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1117',
    fontFamily: 'Inter',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: '#39FF14',
    flex: 2,
  },
  acceptBtnText: {
    color: '#0D1117',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  declineBtn: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  declineBtnText: {
    color: '#8B949E',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  playBtn: {
    backgroundColor: '#58A6FF',
    margin: 16,
    marginTop: 4,
  },
  playBtnText: {
    color: '#0D1117',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  expiry: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8B949E',
    fontFamily: 'JetBrainsMono',
    paddingBottom: 12,
  },
  rematchBtn: {
    backgroundColor: '#21262D',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  rematchBtnText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
    fontFamily: 'Inter',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B949E',
    fontFamily: 'Inter',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  goToFriendsBtn: {
    marginTop: 8,
    backgroundColor: '#39FF14',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goToFriendsBtnText: {
    color: '#0D1117',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
});
