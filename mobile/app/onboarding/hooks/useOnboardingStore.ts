import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MindyMood } from '@/components/mindy/MindyMascot';
import type { Domain as LessonDomain } from '@mindy/shared';

export type StepId =
  | 'hello' | 'level' | 'domain' | 'goal' | 'time'
  | 'demo' | 'result' | 'signup' | 'plan';

export const STEP_ORDER: StepId[] = [
  'hello', 'level', 'domain', 'goal', 'time',
  'demo', 'result', 'signup', 'plan',
];

export type Level = 'beginner' | 'intermediate' | 'advanced';

export type Domain = LessonDomain | 'BOTH';

interface DemoAnswer { questionId: string; correct: boolean }

interface OnboardingState {
  currentStep: StepId;
  level: Level | null;
  mood: MindyMood;

  domain: Domain | null;
  goal: string | null;
  dailyMinutes: 5 | 10 | 15 | null;

  demoScore: number;
  demoAnswers: DemoAnswer[];

  username: string;
  email: string | null;
  password: string;

  notificationsEnabled: boolean;
  reminderHour: number | null;

  goTo: (step: StepId) => void;
  next: () => void;
  back: () => void;
  setDomain: (d: Domain) => void;
  setGoal: (g: string) => void;
  setDailyMinutes: (m: 5 | 10 | 15) => void;
  setLevel: (l: Level) => void;
  setMood: (m: MindyMood) => void;
  recordDemoAnswer: (questionId: string, correct: boolean) => void;
  setUsername: (u: string) => void;
  setEmail: (e: string | null) => void;
  setPassword: (p: string) => void;
  setNotifications: (enabled: boolean, hour: number | null) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 'hello' as StepId,
  level: null,
  mood: 'neutral' as MindyMood,
  domain: null,
  goal: null,
  dailyMinutes: null,
  demoScore: 0,
  demoAnswers: [],
  username: '',
  email: null,
  password: '',
  notificationsEnabled: false,
  reminderHour: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      goTo: (step) => set({ currentStep: step }),
      next: () => {
        const { currentStep } = get();
        const idx = STEP_ORDER.indexOf(currentStep);
        if (idx >= 0 && idx < STEP_ORDER.length - 1) set({ currentStep: STEP_ORDER[idx + 1] });
      },
      back: () => {
        const { currentStep } = get();
        const idx = STEP_ORDER.indexOf(currentStep);
        if (idx > 0) set({ currentStep: STEP_ORDER[idx - 1] });
      },
      setDomain: (domain) => set({ domain }),
      setGoal: (goal) => set({ goal }),
      setDailyMinutes: (dailyMinutes) => set({ dailyMinutes }),
      setLevel: (level) => set({ level }),
      setMood: (mood) => set({ mood }),
      recordDemoAnswer: (questionId, correct) =>
        set((s) => ({
          demoAnswers: [...s.demoAnswers, { questionId, correct }],
          demoScore: s.demoScore + (correct ? 1 : 0),
        })),
      setUsername: (username) => set({ username }),
      setEmail: (email) => set({ email }),
      setPassword: (password) => set({ password }),
      setNotifications: (enabled, hour) => set({ notificationsEnabled: enabled, reminderHour: hour }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: '@mindy/onboarding_state',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        // Never persist the plaintext password to AsyncStorage.
        const { password: _password, ...rest } = state;
        return rest as OnboardingState;
      },
    },
  ),
);

export function getStepProgress(step: StepId): number {
  const idx = STEP_ORDER.indexOf(step);
  return ((idx + 1) / STEP_ORDER.length) * 100;
}
