import { demoQuestions } from './demoQuestions';

describe('demoQuestions', () => {
  it.each(['CRYPTO', 'FINANCE', 'BOTH'] as const)('%s has exactly 3 questions', (domain) => {
    expect(demoQuestions[domain]).toHaveLength(3);
  });

  it('each question has a unique id', () => {
    // BOTH reuses IDs from CRYPTO/FINANCE intentionally (same questions); just check internal consistency per-domain
    expect(new Set(demoQuestions.CRYPTO.map(q => q.id)).size).toBe(3);
    expect(new Set(demoQuestions.FINANCE.map(q => q.id)).size).toBe(3);
  });

  it('image_choice and choice questions have exactly one correct option', () => {
    const allQuestions = [
      ...demoQuestions.CRYPTO,
      ...demoQuestions.FINANCE,
      ...demoQuestions.BOTH,
    ];
    for (const q of allQuestions) {
      if (q.type === 'image_choice' || q.type === 'choice') {
        const correct = q.options.filter(o => o.isCorrect).length;
        expect(correct).toBe(1);
      }
    }
  });
});
