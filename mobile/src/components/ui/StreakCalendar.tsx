import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

interface StreakCalendarProps {
  streak: number;
  atRisk?: boolean;
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * StreakCalendar — Displays the last 7 days as a visual streak tracker.
 * Lit = day is within the current streak. Today is always last.
 */
export function StreakCalendar({ streak, atRisk = false }: StreakCalendarProps) {
  // Build last 7 days array (oldest → newest, index 6 = today)
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      label: DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1], // Mon=0...Sun=6
      isToday: i === 6,
      isLit: i >= 7 - Math.min(streak, 7),
    };
  });

  const activeColor = atRisk ? '#FF6B35' : '#39FF14';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ton activité</Text>
        <View style={styles.streakBadge}>
          <Text style={[styles.streakCount, { color: activeColor }]}>🔥 {streak}</Text>
          <Text style={styles.streakLabel}>jours</Text>
        </View>
      </View>
      <View style={styles.days}>
        {days.map((day, i) => (
          <Animated.View
            key={i}
            entering={ZoomIn.delay(i * 40).duration(280)}
            style={styles.dayWrapper}
          >
            <View
              style={[
                styles.dayCirle,
                day.isLit && { backgroundColor: activeColor + '25', borderColor: activeColor },
                day.isToday && day.isLit && { backgroundColor: activeColor + '40' },
              ]}
            >
              {day.isLit ? (
                <Text style={[styles.dayFlame, { color: activeColor }]}>
                  {day.isToday ? '🔥' : '✓'}
                </Text>
              ) : (
                <View style={styles.emptyDot} />
              )}
            </View>
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {day.label}
            </Text>
          </Animated.View>
        ))}
      </View>
      {atRisk && (
        <Animated.View entering={FadeIn} style={styles.atRiskBanner}>
          <Text style={styles.atRiskText}>⚠️ Complète une leçon aujourd'hui pour garder ton streak !</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakCount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 15,
    fontWeight: '700',
    color: '#39FF14',
  },
  streakLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayWrapper: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dayCirle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0D1117',
    borderWidth: 1.5,
    borderColor: '#30363D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayFlame: {
    fontSize: 16,
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30363D',
  },
  dayLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#484F58',
  },
  dayLabelToday: {
    color: '#8B949E',
    fontWeight: '700',
  },
  atRiskBanner: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  atRiskText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#FF6B35',
    textAlign: 'center',
  },
});
