/**
 * Daily XP Goal Hook
 * Manages the user's daily XP target and tracks progress
 *
 * Storage keys:
 *   @mindy/daily_goal        — target XP (50 | 100 | 150)
 *   @mindy/daily_xp_date     — ISO date string of when we last recorded start XP
 *   @mindy/daily_xp_start    — XP at start of current day (number as string)
 *   @mindy/daily_goal_celebrated — date when celebration was last shown
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOAL_KEY = '@mindy/daily_goal';
const DATE_KEY = '@mindy/daily_xp_date';
const START_KEY = '@mindy/daily_xp_start';
const CELEBRATED_KEY = '@mindy/daily_goal_celebrated';

export const GOAL_OPTIONS = [
  { value: 50,  label: '50 XP',  sub: 'Casual 🌱',   color: '#8B949E' },
  { value: 100, label: '100 XP', sub: 'Regular 🔥',   color: '#39FF14' },
  { value: 150, label: '150 XP', sub: 'Intense ⚡',   color: '#FFD700' },
] as const;

export type GoalValue = 50 | 100 | 150;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

interface DailyGoalState {
  goal: GoalValue;
  xpToday: number;
  isGoalReached: boolean;
  shouldCelebrate: boolean;
  progress: number; // 0–1
}

interface UseDailyGoalReturn extends DailyGoalState {
  setGoal: (g: GoalValue) => Promise<void>;
  initDay: (currentXp: number) => Promise<void>;
  markCelebrated: () => Promise<void>;
}

export function useDailyGoal(currentXp: number): UseDailyGoalReturn {
  const [goal, setGoalState] = useState<GoalValue>(50);
  const [startXp, setStartXp] = useState<number>(currentXp);
  const [celebrated, setCelebrated] = useState<string>('');

  // Load from AsyncStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedGoal, storedDate, storedStart, storedCelebrated] = await Promise.all([
        AsyncStorage.getItem(GOAL_KEY),
        AsyncStorage.getItem(DATE_KEY),
        AsyncStorage.getItem(START_KEY),
        AsyncStorage.getItem(CELEBRATED_KEY),
      ]);

      if (cancelled) return;

      if (storedGoal) {
        setGoalState(Number(storedGoal) as GoalValue);
      }
      if (storedCelebrated) {
        setCelebrated(storedCelebrated);
      }

      const today = todayIso();
      if (storedDate === today && storedStart !== null) {
        // Same day — use stored start XP
        setStartXp(Number(storedStart));
      } else {
        // New day — reset start XP to current
        await AsyncStorage.multiSet([
          [DATE_KEY, today],
          [START_KEY, String(currentXp)],
        ]);
        setStartXp(currentXp);
      }
    })();
    return () => { cancelled = true; };
  }, []); // Only on mount — currentXp captured once

  const initDay = useCallback(async (xp: number) => {
    const today = todayIso();
    const storedDate = await AsyncStorage.getItem(DATE_KEY);
    if (storedDate !== today) {
      await AsyncStorage.multiSet([
        [DATE_KEY, today],
        [START_KEY, String(xp)],
      ]);
      setStartXp(xp);
    }
  }, []);

  const setGoal = useCallback(async (g: GoalValue) => {
    setGoalState(g);
    await AsyncStorage.setItem(GOAL_KEY, String(g));
  }, []);

  const markCelebrated = useCallback(async () => {
    const today = todayIso();
    setCelebrated(today);
    await AsyncStorage.setItem(CELEBRATED_KEY, today);
  }, []);

  const xpToday = Math.max(0, currentXp - startXp);
  const isGoalReached = xpToday >= goal;
  const shouldCelebrate = isGoalReached && celebrated !== todayIso();
  const progress = Math.min(xpToday / goal, 1);

  return {
    goal,
    xpToday,
    isGoalReached,
    shouldCelebrate,
    progress,
    setGoal,
    initDay,
    markCelebrated,
  };
}
