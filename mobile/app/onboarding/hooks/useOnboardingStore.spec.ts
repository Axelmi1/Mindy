// Mock AsyncStorage for Node-side tests
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

import { useOnboardingStore, STEP_ORDER, getStepProgress } from './useOnboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => useOnboardingStore.getState().reset());

  it('starts at welcome', () => {
    expect(useOnboardingStore.getState().currentStep).toBe('welcome');
  });

  it('next() advances through the step order', () => {
    useOnboardingStore.getState().next();
    expect(useOnboardingStore.getState().currentStep).toBe('domain');
    useOnboardingStore.getState().next();
    expect(useOnboardingStore.getState().currentStep).toBe('goal');
  });

  it('back() goes to previous step', () => {
    useOnboardingStore.getState().goTo('goal');
    useOnboardingStore.getState().back();
    expect(useOnboardingStore.getState().currentStep).toBe('domain');
  });

  it('next() does not advance past the last step', () => {
    useOnboardingStore.getState().goTo('notifications');
    useOnboardingStore.getState().next();
    expect(useOnboardingStore.getState().currentStep).toBe('notifications');
  });

  it('recordDemoAnswer bumps score for correct answers only', () => {
    useOnboardingStore.getState().recordDemoAnswer('q1', true);
    useOnboardingStore.getState().recordDemoAnswer('q2', false);
    useOnboardingStore.getState().recordDemoAnswer('q3', true);
    const s = useOnboardingStore.getState();
    expect(s.demoScore).toBe(2);
    expect(s.demoAnswers).toHaveLength(3);
  });

  it('getStepProgress returns percentage 0-100', () => {
    expect(getStepProgress('welcome')).toBeCloseTo((1 / STEP_ORDER.length) * 100);
    expect(getStepProgress('notifications')).toBe(100);
  });

  it('reset brings state back to initial', () => {
    useOnboardingStore.getState().setDomain('CRYPTO');
    useOnboardingStore.getState().goTo('results');
    useOnboardingStore.getState().reset();
    expect(useOnboardingStore.getState().currentStep).toBe('welcome');
    expect(useOnboardingStore.getState().domain).toBeNull();
  });
});
