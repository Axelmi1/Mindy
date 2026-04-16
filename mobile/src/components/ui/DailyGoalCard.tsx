/**
 * DailyGoalCard — affiche la progression vers l'objectif XP du jour
 * Visible sur Home screen, entre le level bar et le daily challenge
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated as RNAnimated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';

interface DailyGoalCardProps {
  goal: number;       // e.g. 100
  xpToday: number;    // XP earned today
  progress: number;   // 0–1
  isReached: boolean;
}

export function DailyGoalCard({ goal, xpToday, progress, isReached }: DailyGoalCardProps) {
  const barWidth = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(barWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const accentColor = isReached ? '#39FF14' : '#58A6FF';
  const label = isReached ? '🎉 Objectif atteint !' : `${xpToday} / ${goal} XP`;

  return (
    <View style={styles.wrapper}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
      )}
      <LinearGradient
        colors={isReached
          ? ['rgba(57,255,20,0.12)', 'rgba(57,255,20,0.03)'] as const
          : ['rgba(88,166,255,0.10)', 'rgba(88,166,255,0.02)'] as const}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.row}>
        <View style={styles.left}>
          <Icon name="target" size={18} color={accentColor} />
          <View style={styles.textCol}>
            <Text style={styles.heading}>Objectif du jour</Text>
            <Text style={[styles.label, { color: accentColor }]}>{label}</Text>
          </View>
        </View>
        <Text style={[styles.goalBadge, { borderColor: accentColor + '60', color: accentColor }]}>
          {goal} XP
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barBg}>
        <RNAnimated.View
          style={[
            styles.barFill,
            {
              width: barWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: accentColor,
              shadowColor: accentColor,
            },
          ]}
        />
      </View>

      {/* XP markers */}
      <View style={styles.markers}>
        <Text style={styles.markerText}>0</Text>
        <Text style={[styles.markerText, { color: accentColor }]}>
          {Math.round(progress * 100)}%
        </Text>
        <Text style={styles.markerText}>{goal}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    gap: 10,
  },
  androidBg: {
    backgroundColor: 'rgba(22,27,34,0.85)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textCol: {
    gap: 2,
  },
  heading: {
    fontSize: 11,
    color: '#8B949E',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
  },
  goalBadge: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  markers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  markerText: {
    fontSize: 10,
    color: '#484F58',
    fontFamily: 'JetBrainsMono',
  },
});
