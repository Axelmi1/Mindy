/**
 * ShareResultButton — partage du résultat de leçon en image.
 *
 * Rendu : une carte brandée Mindy (dark + néon) rendue hors-écran,
 * capturée avec react-native-view-shot puis partagée via la share sheet
 * native (Stories, WhatsApp, etc.). Sert aussi la com du projet :
 * chaque partage est une pub Mindy.
 */

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';

type ViewShotHandle = React.ComponentRef<typeof ViewShot>;
import * as Sharing from 'expo-sharing';
import { Icon } from '@/components/ui/Icon';

interface ShareResultButtonProps {
  lessonTitle: string;
  xp: number;
  accuracy: number;
  streak: number;
  username?: string | null;
}

export function ShareResultButton({ lessonTitle, xp, accuracy, streak, username }: ShareResultButtonProps) {
  const cardRef = useRef<ViewShotHandle>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Partager mon résultat Mindy',
        });
      } else {
        Alert.alert('Partage indisponible', "Le partage n'est pas disponible sur cet appareil.");
      }
    } catch (err) {
      console.warn('[ShareResult] capture/share failed:', err);
      Alert.alert('Oups', "Impossible de générer l'image. Réessaie.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      {/* Carte rendue hors-écran, capturée au moment du partage */}
      <View style={styles.offscreen} pointerEvents="none">
        <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.logo}>MINDY</Text>
              <Text style={styles.logoDot}>●</Text>
            </View>

            <Text style={styles.headline}>Leçon terminée ✅</Text>
            <Text style={styles.lessonTitle} numberOfLines={2}>{lessonTitle}</Text>

            <View style={styles.xpRow}>
              <Text style={styles.xpValue}>+{xp}</Text>
              <Text style={styles.xpLabel}>XP</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statPillText}>🎯 {accuracy}%</Text>
              </View>
              {streak > 0 && (
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>🔥 {streak}</Text>
                </View>
              )}
              {username ? (
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>@{username}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.tagline}>Le Duolingo du business 🧠⚡</Text>
            </View>
          </View>
        </ViewShot>
      </View>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        disabled={isSharing}
        activeOpacity={0.8}
      >
        {isSharing ? (
          <ActivityIndicator size="small" color="#39FF14" />
        ) : (
          <>
            <Icon name="share" size={16} color="#39FF14" />
            <Text style={styles.shareButtonText}>Partager mon résultat</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -1200,
    top: 0,
  },
  card: {
    width: 360,
    backgroundColor: '#0D1117',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#39FF14',
    padding: 28,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#E6EDF3',
    fontFamily: 'JetBrainsMono-Bold',
    letterSpacing: 4,
  },
  logoDot: {
    fontSize: 20,
    color: '#39FF14',
  },
  headline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B949E',
    marginBottom: 6,
  },
  lessonTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#E6EDF3',
    textAlign: 'center',
    marginBottom: 18,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 18,
  },
  xpValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#39FF14',
    fontFamily: 'JetBrainsMono-Bold',
    textShadowColor: 'rgba(57, 255, 20, 0.5)',
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },
  xpLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#39FF14',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statPill: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    paddingTop: 14,
    width: '100%',
  },
  tagline: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#161B22',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#39FF14',
    paddingVertical: 13,
    marginTop: 12,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#39FF14',
  },
});
