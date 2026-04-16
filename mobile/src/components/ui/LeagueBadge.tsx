/**
 * LeagueBadge — affiche la ligue (Iron/Bronze/Silver/Gold/Platinum) selon l'XP
 * Utilisé sur Profile, Home, Leaderboard
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getLeague } from '@/utils/league';

interface LeagueBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function LeagueBadge({ xp, size = 'md', showName = true }: LeagueBadgeProps) {
  const league = getLeague(xp);

  const sizes = {
    sm: { emoji: 14, font: 10, px: 6,  py: 2,  gap: 3,  radius: 6  },
    md: { emoji: 18, font: 12, px: 9,  py: 4,  gap: 5,  radius: 8  },
    lg: { emoji: 22, font: 14, px: 12, py: 6,  gap: 6,  radius: 10 },
  };

  const s = sizes[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: league.glowColor,
          borderColor: league.color + '80',
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          gap: s.gap,
          borderRadius: s.radius,
        },
      ]}
    >
      <Text style={{ fontSize: s.emoji }}>{league.emoji}</Text>
      {showName && (
        <Text style={[styles.name, { fontSize: s.font, color: league.color }]}>
          {league.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  name: {
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
