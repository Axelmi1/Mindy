import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 24 * 2; // left + right screen padding
const INNER_PADDING = 16 * 2; // card padding
const AVAILABLE_WIDTH = SCREEN_WIDTH - PADDING - INNER_PADDING;

const WEEKS = 8;
const DAYS_PER_WEEK = 7;
const TOTAL_CELLS = WEEKS * DAYS_PER_WEEK; // 56

const GAP = 3;
const CELL_SIZE = Math.floor((AVAILABLE_WIDTH - (WEEKS - 1) * GAP) / WEEKS);

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; // Mon → Sun

interface DayData {
  date: string;
  count: number;
  xpEarned: number;
}

interface ActivityHeatmapProps {
  data: DayData[];
  isLoading?: boolean;
}

/**
 * ActivityHeatmap — GitHub-style contribution grid
 * Shows lesson completion intensity for the last 8 weeks.
 */
export function ActivityHeatmap({ data, isLoading = false }: ActivityHeatmapProps) {
  const { grid, totalLessons, totalXp, activeDays, maxCount } = useMemo(() => {
    if (!data || data.length === 0) {
      return { grid: [], totalLessons: 0, totalXp: 0, activeDays: 0, maxCount: 1 };
    }

    const totalLessons = data.reduce((s, d) => s + d.count, 0);
    const totalXp = data.reduce((s, d) => s + d.xpEarned, 0);
    const activeDays = data.filter((d) => d.count > 0).length;
    const maxCount = Math.max(1, ...data.map((d) => d.count));

    // We have data for `days` starting from `since`.
    // We want to display the last TOTAL_CELLS days as a grid of WEEKS columns × 7 rows.
    // Column 0 = oldest week, column WEEKS-1 = current week.
    // Row 0 = Monday, row 6 = Sunday.

    // Take the last TOTAL_CELLS days from data
    const slice = data.slice(-TOTAL_CELLS);

    // Pad at the beginning if data is shorter than TOTAL_CELLS
    const padded: (DayData | null)[] = [
      ...Array(TOTAL_CELLS - slice.length).fill(null),
      ...slice,
    ];

    // Build grid: columns = weeks, rows = days
    const grid: (DayData | null)[][] = [];
    for (let week = 0; week < WEEKS; week++) {
      const col: (DayData | null)[] = [];
      for (let day = 0; day < DAYS_PER_WEEK; day++) {
        col.push(padded[week * DAYS_PER_WEEK + day]);
      }
      grid.push(col);
    }

    return { grid, totalLessons, totalXp, activeDays, maxCount };
  }, [data]);

  const getColor = (count: number): string => {
    if (count === 0) return '#161B22';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return 'rgba(57, 255, 20, 0.25)';
    if (intensity <= 0.5) return 'rgba(57, 255, 20, 0.5)';
    if (intensity <= 0.75) return 'rgba(57, 255, 20, 0.75)';
    return '#39FF14';
  };

  const getBorderColor = (count: number): string => {
    if (count === 0) return '#21262D';
    return 'rgba(57, 255, 20, 0.3)';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Activité</Text>
        </View>
        <View style={styles.grid}>
          {Array.from({ length: WEEKS }).map((_, w) => (
            <View key={w} style={styles.column}>
              {Array.from({ length: DAYS_PER_WEEK }).map((_, d) => (
                <View
                  key={d}
                  style={[styles.cell, { backgroundColor: '#161B22', borderColor: '#21262D' }]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activité</Text>
        <Text style={styles.subtitle}>{WEEKS} semaines</Text>
      </View>

      {/* Day labels (Mon → Sun) */}
      <View style={styles.dayLabelsRow}>
        <View style={styles.dayLabelsGutter} />
        {DAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.dayLabel}>{label}</Text>
        ))}
      </View>

      {/* Heatmap grid */}
      <View style={styles.gridWrapper}>
        {/* Row labels (days of week) as first column */}
        <View style={styles.rowLabels}>
          {DAY_LABELS.map((label, i) => (
            <Text key={i} style={[styles.rowLabel, { height: CELL_SIZE, lineHeight: CELL_SIZE }]}>
              {i % 2 === 0 ? label : ''}
            </Text>
          ))}
        </View>
        {/* Grid columns (weeks) */}
        <View style={styles.grid}>
          {grid.map((col, weekIdx) => (
            <View key={weekIdx} style={styles.column}>
              {col.map((day, dayIdx) => (
                <Animated.View
                  key={dayIdx}
                  entering={
                    day && day.count > 0
                      ? ZoomIn.delay(weekIdx * 20 + dayIdx * 8).duration(200)
                      : undefined
                  }
                  style={[
                    styles.cell,
                    {
                      backgroundColor: day ? getColor(day.count) : '#0D1117',
                      borderColor: day ? getBorderColor(day.count) : '#21262D',
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalLessons}</Text>
          <Text style={styles.statLabel}>leçons</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>{totalXp.toLocaleString()}</Text>
          <Text style={styles.statLabel}>XP gagnés</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#58A6FF' }]}>{activeDays}</Text>
          <Text style={styles.statLabel}>jours actifs</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Moins</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
          <View
            key={i}
            style={[
              styles.legendCell,
              {
                backgroundColor: intensity === 0 ? '#161B22' : `rgba(57, 255, 20, ${intensity})`,
                borderColor: intensity === 0 ? '#21262D' : 'rgba(57, 255, 20, 0.3)',
              },
            ]}
          />
        ))}
        <Text style={styles.legendLabel}>Plus</Text>
      </View>
    </Animated.View>
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
  subtitle: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#484F58',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18, // gutter width
    gap: GAP,
  },
  dayLabelsGutter: {
    // placeholder for alignment
  },
  dayLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    color: '#484F58',
    width: CELL_SIZE,
    textAlign: 'center',
  },
  gridWrapper: {
    flexDirection: 'row',
    gap: 4,
  },
  rowLabels: {
    width: 14,
    gap: GAP,
  },
  rowLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    color: '#484F58',
    textAlignVertical: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: GAP,
    flex: 1,
  },
  column: {
    flex: 1,
    gap: GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    fontWeight: '700',
    color: '#39FF14',
  },
  statLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#484F58',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#21262D',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  legendLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#484F58',
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
  },
});
