import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Icon } from './Icon';
import { ReferralStats } from '@/api/client';
import { getTierProgress } from '@/hooks/useReferrals';

// Dynamic import for clipboard (optional dependency)
let Clipboard: { setStringAsync?: (text: string) => Promise<boolean> } | null = null;
try {
  Clipboard = require('expo-clipboard');
} catch {
  // expo-clipboard not installed, copy will show alert instead
}

interface ReferralCardProps {
  stats: ReferralStats | null;
  onShare: () => void;
  isLoading?: boolean;
}

/**
 * ReferralCard - Displays referral code and stats
 */
export function ReferralCard({ stats, onShare, isLoading = false }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!stats?.referralCode) return;

    try {
      if (Clipboard?.setStringAsync) {
        await Clipboard.setStringAsync(stats.referralCode);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback: show the code in an alert
        Alert.alert('Referral Code', stats.referralCode, [{ text: 'OK' }]);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error('Error copying:', err);
      Alert.alert('Referral Code', stats.referralCode, [{ text: 'OK' }]);
    }
  };

  if (isLoading || !stats) {
    return (
      <View style={styles.container}>
        <View style={styles.inner}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
          )}
          <View style={styles.content}>
            <View style={styles.loadingPlaceholder} />
          </View>
        </View>
      </View>
    );
  }

  const tierProgress = getTierProgress(stats.totalReferrals, stats.nextTierAt);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#58A6FF60', '#58A6FF10', '#58A6FF40'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      />
      <View style={styles.inner}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
        )}
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.05)'] as const}
          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        />
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon name="gift" size={20} color="#58A6FF" />
              <Text style={styles.title}>Invite Friends</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statValue}>{stats.totalReferrals}</Text>
              <Text style={styles.statLabel}>referred</Text>
            </View>
          </View>

          {/* Referral Code */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Your referral code</Text>
            <View style={styles.codeRow}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{stats.referralCode}</Text>
              </View>
              <Pressable style={styles.copyButton} onPress={handleCopy}>
                <Icon name={copied ? 'check' : 'copy'} size={18} color={copied ? '#39FF14' : '#E6EDF3'} />
              </Pressable>
            </View>
          </View>

          {/* XP Earned */}
          <View style={styles.xpRow}>
            <View style={styles.xpInfo}>
              <Icon name="zap" size={16} color="#FFD700" />
              <Text style={styles.xpEarned}>{stats.xpEarned} XP earned</Text>
            </View>
            {stats.nextTierAt && stats.nextTierBonus && (
              <Text style={styles.tierInfo}>
                +{stats.nextTierBonus} XP at {stats.nextTierAt} referrals
              </Text>
            )}
          </View>

          {/* Progress to next tier */}
          {stats.nextTierAt && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#58A6FF', '#A371F7'] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${tierProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {stats.totalReferrals}/{stats.nextTierAt}
              </Text>
            </View>
          )}

          {/* Share Button */}
          <Pressable style={styles.shareButton} onPress={onShare}>
            <Icon name="share" size={18} color="#0D1117" />
            <Text style={styles.shareButtonText}>Share Code</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradientBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 19,
  },
  inner: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  androidBg: {
    backgroundColor: 'rgba(22, 27, 34, 0.85)',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  loadingPlaceholder: {
    height: 150,
    backgroundColor: '#30363D',
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  statBadge: {
    backgroundColor: 'rgba(88, 166, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#58A6FF',
  },
  statLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#8B949E',
  },
  codeContainer: {
    gap: 8,
  },
  codeLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeBox: {
    flex: 1,
    backgroundColor: '#0D1117',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
  },
  codeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 20,
    fontWeight: '700',
    color: '#E6EDF3',
    letterSpacing: 4,
  },
  copyButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#30363D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpEarned: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
  },
  tierInfo: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#8B949E',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#30363D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#8B949E',
    width: 40,
    textAlign: 'right',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#58A6FF',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  shareButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1117',
  },
});

export default ReferralCard;
