// Mock AsyncStorage for Node-side tests (persist middleware writes on reset)
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

import { useOnboardingStore, STEP_ORDER, getStepProgress, StepId } from '../../app/onboarding/hooks/useOnboardingStore';

const reset = () => useOnboardingStore.getState().reset();

describe('useOnboardingStore', () => {
  beforeEach(reset);

  it('STEP_ORDER contient les 9 nouvelles étapes dans l’ordre', () => {
    expect(STEP_ORDER).toEqual([
      'hello', 'level', 'domain', 'goal', 'time',
      'demo', 'result', 'signup', 'plan',
    ]);
  });

  it('démarre sur hello', () => {
    expect(useOnboardingStore.getState().currentStep).toBe('hello');
  });

  it('next() avance, back() recule, et ne dépasse pas les bornes', () => {
    const { next, back } = useOnboardingStore.getState();
    next(); expect(useOnboardingStore.getState().currentStep).toBe('level');
    back(); expect(useOnboardingStore.getState().currentStep).toBe('hello');
    back(); expect(useOnboardingStore.getState().currentStep).toBe('hello'); // borne basse
  });

  it('setLevel stocke le niveau', () => {
    useOnboardingStore.getState().setLevel('intermediate');
    expect(useOnboardingStore.getState().level).toBe('intermediate');
  });

  it('recordDemoAnswer incrémente le score sur bonne réponse', () => {
    const { recordDemoAnswer } = useOnboardingStore.getState();
    recordDemoAnswer('q1', true);
    recordDemoAnswer('q2', false);
    const s = useOnboardingStore.getState();
    expect(s.demoScore).toBe(1);
    expect(s.demoAnswers).toHaveLength(2);
  });

  it('getStepProgress renvoie 100% sur la dernière étape', () => {
    expect(getStepProgress('plan')).toBe(100);
    expect(getStepProgress('hello')).toBeCloseTo((1 / 9) * 100);
  });

  it('setMood change le mood courant', () => {
    useOnboardingStore.getState().setMood('hype');
    expect(useOnboardingStore.getState().mood).toBe('hype');
  });

  it('reset remet currentStep à hello et vide les réponses', () => {
    const st = useOnboardingStore.getState();
    st.setLevel('advanced'); st.recordDemoAnswer('q', true); st.next();
    st.reset();
    const s = useOnboardingStore.getState();
    expect(s.currentStep).toBe('hello');
    expect(s.level).toBeNull();
    expect(s.demoAnswers).toHaveLength(0);
  });
});

describe('onboarding password', () => {
  beforeEach(() => useOnboardingStore.getState().reset());

  it('stores the password in memory', () => {
    useOnboardingStore.getState().setPassword('secret12');
    expect(useOnboardingStore.getState().password).toBe('secret12');
  });

  it('clears the password on reset', () => {
    useOnboardingStore.getState().setPassword('secret12');
    useOnboardingStore.getState().reset();
    expect(useOnboardingStore.getState().password).toBe('');
  });

  it('excludes the password from the persisted slice', () => {
    const persisted = (useOnboardingStore.persist.getOptions().partialize as any)({
      ...useOnboardingStore.getState(),
      password: 'secret12',
    });
    expect(persisted.password).toBeUndefined();
  });
});
