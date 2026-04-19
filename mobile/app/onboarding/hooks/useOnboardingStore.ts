import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StepId =
  | 'welcome' | 'domain' | 'goal' | 'time'
  | 'mindy_intro' | 'demo_intro'
  | 'demo_q1' | 'demo_q2' | 'demo_q3'
  | 'results' | 'signup' | 'notifications';

export const STEP_ORDER: StepId[] = [
  'welcome', 'domain', 'goal', 'time',
  'mindy_intro', 'demo_intro',
  'demo_q1', 'demo_q2', 'demo_q3',
  'results', 'signup', 'notifications',
];

export type Domain = 'CRYPTO' | 'FINANCE' | 'BOTH';

interface DemoAnswer { questionId: string; correct: boolean }

interface OnboardingState {
  currentStep: StepId;

  domain: Domain | null;
  goal: string | null;
  dailyMinutes: 5 | 10 | 15 | null;

  demoScore: number;
  demoAnswers: DemoAnswer[];

  username: string;
  email: string | null;

  notificationsEnabled: boolean;
  reminderHour: number | null;

  goTo: (step: StepId) => void;
  next: () => void;
  back: () => void;
  setDomain: (d: Domain) => void;
  setGoal: (g: string) => void;
  setDailyMinutes: (m: 5 | 10 | 15) => void;
  recordDemoAnswer: (questionId: string, correct: boolean) => void;
  setUsername: (u: string) => void;
  setEmail: (e: string | null) => void;
  setNotifications: (enabled: boolean, hour: number | null) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 'welcome' as StepId,
  domain: null,
  goal: null,
  dailyMinutes: null,
  demoScore: 0,
  demoAnswers: [],
  username: '',
  email: null,
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
      recordDemoAnswer: (questionId, correct) =>
        set((s) => ({
          demoAnswers: [...s.demoAnswers, { questionId, correct }],
          demoScore: s.demoScore + (correct ? 1 : 0),
        })),
      setUsername: (username) => set({ username }),
      setEmail: (email) => set({ email }),
      setNotifications: (enabled, hour) => set({ notificationsEnabled: enabled, reminderHour: hour }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: '@mindy/onboarding_state',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function getStepProgress(step: StepId): number {
  const idx = STEP_ORDER.indexOf(step);
  return ((idx + 1) / STEP_ORDER.length) * 100;
}
