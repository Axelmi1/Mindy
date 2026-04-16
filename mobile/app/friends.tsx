/**
 * Friends Screen
 *
 * Social layer of Mindly:
 * - Search & add friends
 * - Pending requests (badge)
 * - Friends mini-leaderboard (weekly XP ranking)
 * - Challenge a friend on a lesson ⚔️
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useFriends } from '@/hooks/useFriends';
import { useUser } from '@/hooks/useUser';
import { LeagueBadge } from '@/components/ui/LeagueBadge';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { lessonsApi, challengesApi } from '@/api/client';
import type { Lesson } from '@mindy/shared';

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: '#0D1117',
  surface: '#161B22',
  border: 'rgba(255,255,255,0.08)',
  primary: '#39FF14',
  text: '#E6EDF3',
  muted: '#8B949E',
  danger: '#F85149',
  gold: '#FFD700',
  cyan: '#00FFFF',
};

type Domain = 'CRYPTO' | 'FINANCE' | 'TRADING';
const DOMAIN_COLORS: Record<Domain, string> = {
  CRYPTO: '#F7931A',
  FINANCE: '#39FF14',
  TRADING: '#00FFFF',
};
const DOMAIN_EMOJIS: Record<Domain, string> = {
  CRYPTO: '₿',
  FINANCE: '💹',
  TRADING: '📈',
};

// ─── Lesson Picker Modal ──────────────────────────────────────────────────────

function LessonPickerModal({
  visible,
  friendUsername,
  friendId,
  currentUserId,
  onClose,
}: {
  visible: boolean;
  friendUsername: string;
  friendId: string;
  currentUserId: string;
  onClose: () => void;
}) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<Domain>('CRYPTO');
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    lessonsApi
      .getAll()
      .then((res) => setLessons((res.data ?? []).filter((l) => !l.isMasterQuiz)))
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const filtered = lessons.filter((l) => l.domain === selectedDomain);

  const handleChallenge = async (lesson: Lesson) => {
    if (sending) return;
    setSending(lesson.id);
    try {
      await challengesApi.createChallenge({
        challengerId: currentUserId,
        challengedId: friendId,
        lessonId: lesson.id,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
      Alert.alert(
        '⚔️ Défi envoyé !',
        `${friendUsername} a été défié sur "${lesson.title}". Il a 48h pour relever le challenge.`,
        [{ text: 'OK', onPress: () => router.push('/challenges' as any) }],
      );
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible d\'envoyer le défi');
    } finally {
      setSending(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={pickerStyles.container}>
        {/* Header */}
        <View style={pickerStyles.header}>
          <View>
            <Text style={pickerStyles.title}>⚔️ Défier {friendUsername}</Text>
            <Text style={pickerStyles.subtitle}>Choisis une leçon pour la battle</Text>
          </View>
          <Pressable style={pickerStyles.closeBtn} onPress={onClose}>
            <Text style={pickerStyles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* Domain tabs */}
        <View style={pickerStyles.domainTabs}>
          {(['CRYPTO', 'FINANCE', 'TRADING'] as Domain[]).map((d) => (
            <Pressable
              key={d}
              style={[
                pickerStyles.domainTab,
                selectedDomain === d && { backgroundColor: `${DOMAIN_COLORS[d]}22`, borderColor: DOMAIN_COLORS[d] },
              ]}
              onPress={() => setSelectedDomain(d)}
            >
              <Text style={pickerStyles.domainEmoji}>{DOMAIN_EMOJIS[d]}</Text>
              <Text style={[
                pickerStyles.domainLabel,
                selectedDomain === d && { color: DOMAIN_COLORS[d] },
              ]}>
                {d}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Lesson list */}
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={pickerStyles.list}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 40)}>
                <Pressable
                  style={pickerStyles.lessonRow}
                  onPress={() => handleChallenge(item)}
                  disabled={!!sending}
                >
                  <View style={pickerStyles.lessonInfo}>
                    <Text style={pickerStyles.lessonTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={pickerStyles.lessonMeta}>
                      <View style={[pickerStyles.diffBadge, {
                        backgroundColor: item.difficulty === 'BEGINNER'
                          ? '#39FF1422'
                          : item.difficulty === 'INTERMEDIATE'
                          ? '#FFD70022'
                          : '#F8514922',
                      }]}>
                        <Text style={[pickerStyles.diffText, {
                          color: item.difficulty === 'BEGINNER'
                            ? C.primary
                            : item.difficulty === 'INTERMEDIATE'
                            ? C.gold
                            : C.danger,
                        }]}>
                          {item.difficulty}
                        </Text>
                      </View>
                      <Text style={pickerStyles.xpText}>+{item.xpReward} XP</Text>
                    </View>
                  </View>
                  {sending === item.id ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <View style={pickerStyles.challengeBtn}>
                      <Text style={pickerStyles.challengeBtnText}>⚔️</Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            )}
            ListEmptyComponent={
              <View style={pickerStyles.empty}>
                <Text style={pickerStyles.emptyText}>Aucune leçon dans ce domaine</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: { color: C.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: C.muted, fontSize: 13, marginTop: 4 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  closeBtnText: { color: C.muted, fontSize: 16 },
  domainTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  domainTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: C.border,
    gap: 4,
  },
  domainEmoji: { fontSize: 14 },
  domainLabel: { color: C.muted, fontSize: 12, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  lessonInfo: { flex: 1 },
  lessonTitle: { color: C.text, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: '700' },
  xpText: { color: C.primary, fontSize: 12, fontWeight: '700' },
  challengeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: `${C.primary}22`, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: `${C.primary}66`,
  },
  challengeBtnText: { fontSize: 18 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: C.muted, fontSize: 14 },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function FriendRow({
  friend,
  rank,
  onChallenge,
}: {
  friend: any;
  rank: number;
  onChallenge: (friend: any) => void;
}) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <View style={styles.friendRow}>
      <View style={styles.friendRank}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={styles.rankNum}>{rank}</Text>
        )}
      </View>

      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>
          {friend.username.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.friendInfo}>
        <Text style={styles.friendUsername}>{friend.username}</Text>
        <View style={styles.friendMeta}>
          <Text style={styles.friendMetaText}>Lvl {friend.level}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.friendMetaText}>🔥 {friend.streak}</Text>
        </View>
      </View>

      <View style={styles.friendRight}>
        <Text style={styles.weeklyXp}>{friend.weeklyXp}</Text>
        <Text style={styles.weeklyXpLabel}>XP this week</Text>
        <LeagueBadge xp={friend.xp} size="sm" />
      </View>

      {/* Challenge button */}
      <Pressable
        style={styles.challengeBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChallenge(friend);
        }}
        hitSlop={8}
      >
        <Text style={styles.challengeBtnText}>⚔️</Text>
      </Pressable>
    </View>
  );
}

function SearchResultRow({
  user,
  onAdd,
}: {
  user: any;
  onAdd: (id: string) => void;
}) {
  const isPending = user.friendStatus === 'PENDING';
  const isFriend = user.friendStatus === 'ACCEPTED';

  return (
    <View style={styles.searchRow}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>
          {user.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendUsername}>{user.username}</Text>
        <Text style={styles.friendMetaText}>Lvl {user.level} · {user.league}</Text>
      </View>
      {isFriend ? (
        <View style={[styles.addBtn, styles.addBtnDisabled]}>
          <Text style={styles.addBtnText}>Friends ✓</Text>
        </View>
      ) : isPending ? (
        <View style={[styles.addBtn, styles.addBtnPending]}>
          <Text style={styles.addBtnText}>Pending…</Text>
        </View>
      ) : (
        <Pressable style={styles.addBtn} onPress={() => onAdd(user.id)}>
          <Text style={[styles.addBtnText, { color: C.primary }]}>+ Add</Text>
        </Pressable>
      )}
    </View>
  );
}

function PendingRequestRow({
  request,
  onAccept,
  onDecline,
}: {
  request: any;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  return (
    <View style={styles.searchRow}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>
          {request.sender.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendUsername}>{request.sender.username}</Text>
        <Text style={styles.friendMetaText}>wants to be your friend</Text>
      </View>
      <View style={styles.requestActions}>
        <Pressable
          style={[styles.addBtn, { backgroundColor: `${C.primary}22` }]}
          onPress={() => onAccept(request.id)}
        >
          <Text style={[styles.addBtnText, { color: C.primary }]}>Accept</Text>
        </Pressable>
        <Pressable
          style={[styles.addBtn, styles.addBtnDanger]}
          onPress={() => onDecline(request.id)}
        >
          <Text style={[styles.addBtnText, { color: C.danger }]}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FriendsScreen() {
  const {
    friends,
    pendingRequests,
    searchResults,
    loadingFriends,
    loadingSearch,
    searchQuery,
    setSearchQuery,
    sendRequest,
    acceptRequest,
    removeOrDecline,
    refresh,
  } = useFriends();

  const { userId } = useUser();
  const [tab, setTab] = useState<'friends' | 'search'>('friends');

  // Challenge modal state
  const [challengeTarget, setChallengeTarget] = useState<{
    id: string;
    username: string;
  } | null>(null);

  const isSearchMode = searchQuery.length >= 2;

  const handleOpenChallenge = useCallback((friend: any) => {
    setChallengeTarget({ id: friend.userId, username: friend.username });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Friends</Text>
        {pendingRequests.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingRequests.length}</Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username…"
            placeholderTextColor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Tabs (only show when not searching) */}
      {!isSearchMode && (
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'friends' && styles.tabActive]}
            onPress={() => setTab('friends')}
          >
            <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
              My Friends {friends.length > 0 ? `(${friends.length})` : ''}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'search' && styles.tabActive]}
            onPress={() => setTab('search')}
          >
            <Text style={[styles.tabText, tab === 'search' && styles.tabTextActive]}>
              Requests {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search results */}
        {isSearchMode && (
          <Animated.View entering={FadeInDown}>
            <Text style={styles.sectionTitle}>Search results</Text>
            {loadingSearch ? (
              <ActivityIndicator color={C.primary} style={{ marginTop: 16 }} />
            ) : searchResults.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No users found for "{searchQuery}"</Text>
              </View>
            ) : (
              searchResults.map((u) => (
                <SearchResultRow key={u.id} user={u} onAdd={sendRequest} />
              ))
            )}
          </Animated.View>
        )}

        {/* Friends leaderboard */}
        {!isSearchMode && tab === 'friends' && (
          <Animated.View entering={FadeInDown}>
            {loadingFriends ? (
              <>
                <SkeletonBox height={70} style={styles.skeletonRow} />
                <SkeletonBox height={70} style={styles.skeletonRow} />
                <SkeletonBox height={70} style={styles.skeletonRow} />
              </>
            ) : friends.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={styles.emptyTitle}>No friends yet</Text>
                <Text style={styles.emptyText}>
                  Search for friends by username to compete on the weekly leaderboard!
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.leaderboardHeader}>
                  <Text style={styles.sectionTitle}>Weekly Leaderboard</Text>
                  <Text style={styles.muted}>resets every Monday</Text>
                </View>
                {/* Challenge hint */}
                <View style={styles.challengeHint}>
                  <Text style={styles.challengeHintText}>
                    ⚔️ Tape le bouton pour défier un ami sur une leçon
                  </Text>
                </View>
                {friends.map((f, i) => (
                  <Animated.View key={f.userId} entering={FadeInDown.delay(i * 60)}>
                    <FriendRow
                      friend={f}
                      rank={i + 1}
                      onChallenge={handleOpenChallenge}
                    />
                  </Animated.View>
                ))}
              </>
            )}
          </Animated.View>
        )}

        {/* Pending requests */}
        {!isSearchMode && tab === 'search' && (
          <Animated.View entering={FadeInDown}>
            {pendingRequests.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📬</Text>
                <Text style={styles.emptyTitle}>No pending requests</Text>
                <Text style={styles.emptyText}>
                  When someone adds you, their request will appear here.
                </Text>
              </View>
            ) : (
              pendingRequests.map((req) => (
                <PendingRequestRow
                  key={req.id}
                  request={req}
                  onAccept={acceptRequest}
                  onDecline={removeOrDecline}
                />
              ))
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Lesson Picker Modal */}
      {challengeTarget && userId && (
        <LessonPickerModal
          visible={!!challengeTarget}
          friendUsername={challengeTarget.username}
          friendId={challengeTarget.id}
          currentUserId={userId}
          onClose={() => setChallengeTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backBtnText: { color: C.text, fontSize: 22 },
  title: { color: C.text, fontSize: 22, fontWeight: '800', flex: 1 },
  badge: {
    backgroundColor: C.danger,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: C.text, fontSize: 15 },
  clearBtn: { color: C.muted, fontSize: 14, paddingHorizontal: 4 },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: `${C.primary}22` },
  tabText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: C.primary },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingBottom: 32 },

  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  muted: { color: C.muted, fontSize: 12 },

  challengeHint: {
    backgroundColor: `${C.primary}11`,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${C.primary}22`,
  },
  challengeHintText: { color: C.primary, fontSize: 12, opacity: 0.8 },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  friendRank: { width: 28, alignItems: 'center' },
  medal: { fontSize: 20 },
  rankNum: { color: C.muted, fontSize: 15, fontWeight: '700' },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${C.primary}22`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${C.primary}44`,
  },
  friendAvatarText: { color: C.primary, fontSize: 16, fontWeight: '800' },
  friendInfo: { flex: 1 },
  friendUsername: { color: C.text, fontSize: 14, fontWeight: '700' },
  friendMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  friendMetaText: { color: C.muted, fontSize: 12 },
  dot: { color: C.muted, fontSize: 12 },
  friendRight: { alignItems: 'flex-end', gap: 4 },
  weeklyXp: { color: C.primary, fontSize: 16, fontWeight: '800' },
  weeklyXpLabel: { color: C.muted, fontSize: 10 },

  challengeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${C.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: `${C.primary}44`,
  },
  challengeBtnText: { fontSize: 16 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${C.primary}44`,
  },
  addBtnDisabled: { borderColor: C.border, opacity: 0.5 },
  addBtnPending: { borderColor: `${C.muted}44` },
  addBtnDanger: { borderColor: `${C.danger}44` },
  addBtnText: { fontSize: 13, fontWeight: '600', color: C.muted },
  requestActions: { flexDirection: 'row', gap: 6 },

  skeletonRow: { marginBottom: 8, borderRadius: 12 },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyEmoji: { fontSize: 44, marginBottom: 8 },
  emptyTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  emptyText: { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
