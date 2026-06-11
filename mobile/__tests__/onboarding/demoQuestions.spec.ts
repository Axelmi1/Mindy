import { demoQuestions, DemoQuestion } from '../../app/onboarding/data/demoQuestions';

const all = (): DemoQuestion[] => [
  ...demoQuestions.CRYPTO!, ...demoQuestions.FINANCE!, ...demoQuestions.BOTH!,
];

describe('demoQuestions', () => {
  it.each(['CRYPTO', 'FINANCE', 'BOTH'] as const)(
    '%s a au moins 3 questions (pool sélectionnable)',
    (domain) => { expect(demoQuestions[domain]!.length).toBeGreaterThanOrEqual(3); },
  );

  it('chaque question a une difficulté valide', () => {
    for (const q of all()) {
      expect(['beginner', 'intermediate', 'advanced']).toContain(q.difficulty);
    }
  });

  it('chaque domaine couvre les 3 difficultés', () => {
    for (const domain of ['CRYPTO', 'FINANCE', 'BOTH'] as const) {
      const diffs = new Set(demoQuestions[domain]!.map((q) => q.difficulty));
      expect(diffs.has('beginner')).toBe(true);
      expect(diffs.has('intermediate')).toBe(true);
      expect(diffs.has('advanced')).toBe(true);
    }
  });

  it('les questions image_choice/choice ont exactement une bonne option', () => {
    for (const q of all()) {
      if (q.type === 'image_choice' || q.type === 'choice') {
        expect(q.options.filter((o) => o.isCorrect).length).toBe(1);
      }
    }
  });
});
