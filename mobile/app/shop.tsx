/**
 * Boutique d'avatars — dépenser son XP durement gagnée.
 * Achat = équipe direct. Les possédés se ré-équipent d'un tap.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { usersApi, AvatarShop, AvatarShopItem } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';
import { Confetti } from '@/components/animations';

const RARITY_COLORS: Record<AvatarShopItem['rarity'], string> = {
  COMMON: '#8B949E',
  RARE: '#58A6FF',
  EPIC: '#BC8CFF',
  LEGENDARY: '#FFD700',
};

const RARITY_LABELS: Record<AvatarShopItem['rarity'], string> = {
  COMMON: 'Commun',
  RARE: 'Rare',
  EPIC: 'Épique',
  LEGENDARY: 'Légendaire',
};

export default function ShopScreen() {
  const { userId } = useUser();
  const [shop, setShop] = useState<AvatarShop | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await usersApi.getAvatarShop(userId);
      if (res.success && res.data) setShop(res.data);
    } catch (err) {
      console.error('[Shop] load error:', err);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePress = async (item: AvatarShopItem) => {
    if (!userId || busyId) return;

    if (item.equipped) return;

    if (item.owned) {
      setBusyId(item.id);
      try {
        await usersApi.equipAvatar(userId, item.id);
        await load();
      } catch (e: any) {
        Alert.alert('Oups', e?.message ?? 'Impossible d\'équiper cet avatar.');
      } finally {
        setBusyId(null);
      }
      return;
    }

    if ((shop?.xp ?? 0) < item.price) {
      Alert.alert(
        'Pas assez d\'XP',
        `Il te faut ${item.price} XP pour ${item.name} — tu en as ${shop?.xp ?? 0}. Va faire une leçon ! 📚`,
      );
      return;
    }

    Alert.alert(
      `${item.emoji} ${item.name}`,
      `Acheter cet avatar ${RARITY_LABELS[item.rarity].toLowerCase()} pour ${item.price} XP ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: `Acheter (${item.price} XP)`,
          onPress: async () => {
            setBusyId(item.id);
            try {
              const res = await usersApi.buyAvatar(userId, item.id);
              if (res.success) {
                setShowConfetti(true);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('🎉 À toi !', `${item.emoji} ${item.name} est maintenant ton avatar.`);
                await load();
              }
            } catch (e: any) {
              Alert.alert('Achat impossible', e?.message ?? 'Réessaie plus tard.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  if (!shop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color="#39FF14" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Icon name="chevron-left" size={22} color="#E6EDF3" />
        </TouchableOpacity>
        <Text style={styles.title}>🛒 Boutique</Text>
        <View style={styles.xpBadge}>
          <Icon name="zap" size={14} color="#FFD700" />
          <Text style={styles.xpText}>{shop.xp.toLocaleString()}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Dépense ton XP pour customiser ton avatar</Text>

      <FlatList
        data={shop.items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const rarityColor = RARITY_COLORS[item.rarity];
          const affordable = shop.xp >= item.price;
          return (
            <Animated.View
              entering={FadeInDown.delay(Math.min(Math.floor(index / 2), 8) * 60)
                .springify()
                .damping(16)
                .mass(0.6)}
              style={styles.cardWrapper}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  { borderColor: item.equipped ? '#39FF14' : rarityColor + '55' },
                  item.equipped && styles.cardEquipped,
                ]}
                onPress={() => handlePress(item)}
                disabled={busyId !== null}
                activeOpacity={0.8}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={[styles.rarity, { color: rarityColor }]}>
                  {RARITY_LABELS[item.rarity]}
                </Text>

                {busyId === item.id ? (
                  <ActivityIndicator size="small" color="#39FF14" />
                ) : item.equipped ? (
                  <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.equippedBadge}>
                    <Text style={styles.equippedText}>✓ Équipé</Text>
                  </Animated.View>
                ) : item.owned ? (
                  <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.ownedBadge}>
                    <Text style={styles.ownedText}>Équiper</Text>
                  </Animated.View>
                ) : (
                  <View style={[styles.priceBadge, !affordable && styles.priceBadgeLocked]}>
                    <Icon name="zap" size={12} color={affordable ? '#0D1117' : '#8B949E'} />
                    <Text style={[styles.priceText, !affordable && styles.priceTextLocked]}>
                      {item.price}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />

      {showConfetti && <Confetti count={80} onComplete={() => setShowConfetti(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161B22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#E6EDF3',
    fontFamily: 'Inter',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#161B22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#30363D',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    fontFamily: 'JetBrainsMono-Bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#8B949E',
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  row: {
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  cardEquipped: {
    backgroundColor: 'rgba(57, 255, 20, 0.06)',
  },
  emoji: {
    fontSize: 44,
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  rarity: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#39FF14',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  priceBadgeLocked: {
    backgroundColor: '#21262D',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D1117',
    fontFamily: 'JetBrainsMono-Bold',
  },
  priceTextLocked: {
    color: '#8B949E',
  },
  ownedBadge: {
    backgroundColor: '#21262D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#39FF14',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  ownedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#39FF14',
  },
  equippedBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  equippedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#39FF14',
  },
});
