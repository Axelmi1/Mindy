import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, IconName } from './Icon';
import { Achievement, AchievementRarity } from '@/api/client';
import { getRarityColor, getCategoryIcon } from '@/hooks/useAchievements';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  compact?: boolean;
}

/**
 * AchievementCard - Displays a single achievement with unlock status
 */
export function AchievementCard({
  achievement,
  isUnlocked,
  unlockedAt,
  progress = 0,
  compact = false,
}: AchievementCardProps) {
  const rarityColor = getRarityColor(achievement.rarity);
  const iconName = getCategoryIcon(achievement.category) as IconName;

  if (compact) {
    return (
      <View style={[styles.compactContainer, !isUnlocked && styles.locked]}>
        <View style={[styles.compactIconBg, { borderColor: isUnlocked ? rarityColor : '#30363D' }]}>
          <Icon name={iconName} size={20} color={isUnlocked ? rarityColor : '#484F58'} />
        </View>
        <Text
          style={[styles.compactName, !isUnlocked && styles.lockedText]}
          numberOfLines={2}
        >
          {achievement.name}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, !isUnlocked && styles.locked]}>
      {isUnlocked && (
        <LinearGradient
          colors={[rarityColor + '60', rarityColor + '10', rarityColor + '40'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        />
      )}
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
          {/* Icon */}
          <View style={[styles.iconContainer, { borderColor: isUnlocked ? rarityColor : '#30363D' }]}>
            <Icon name={iconName} size={28} color={isUnlocked ? rarityColor : '#484F58'} />
          </View>

          {/* Info */}
          <View style={styles.info}>
            <View style={styles.header}>
              <Text style={[styles.name, !isUnlocked && styles.lockedText]} numberOfLines={1}>
                {achievement.name}
              </Text>
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '20' }]}>
                <Text style={[styles.rarityText, { color: rarityColor }]}>
                  {achievement.rarity}
                </Text>
              </View>
            </View>

            <Text style={[styles.description, !isUnlocked && styles.lockedText]} numberOfLines={2}>
              {achievement.description}
            </Text>

            {/* XP Reward or Progress */}
            <View style={styles.footer}>
              {isUnlocked ? (
                <View style={styles.xpBadge}>
                  <Icon name="zap" size={12} color="#FFD700" />
                  <Text style={styles.xpText}>+{achievement.xpReward} XP</Text>
                </View>
              ) : (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
              )}

              {isUnlocked && unlockedAt && (
                <Text style={styles.unlockedDate}>
                  {new Date(unlockedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
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
  locked: {
    opacity: 0.6,
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
    flexDirection: 'row',
    gap: 14,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#E6EDF3',
    flex: 1,
  },
  lockedText: {
    color: '#8B949E',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rarityText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    fontWeight: '700',
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  xpText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: '#39FF14',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#8B949E',
    width: 32,
    textAlign: 'right',
  },
  unlockedDate: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#484F58',
  },
  // Compact styles
  compactContainer: {
    width: '47%',
    borderRadius: 16,
    backgroundColor: '#161B22',
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  compactIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  compactName: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#E6EDF3',
    textAlign: 'center',
  },
});

export default AchievementCard;
