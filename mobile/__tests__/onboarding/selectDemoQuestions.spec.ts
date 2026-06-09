import { selectDemoQuestions, levelToDifficulty } from '../../app/onboarding/data/selectDemoQuestions';

describe('selectDemoQuestions', () => {
  it('mappe le niveau vers une difficulté', () => {
    expect(levelToDifficulty('beginner')).toBe('beginner');
    expect(levelToDifficulty('intermediate')).toBe('intermediate');
    expect(levelToDifficulty('advanced')).toBe('advanced');
    expect(levelToDifficulty(null)).toBe('beginner'); // défaut
  });

  it('retourne toujours 3 questions', () => {
    expect(selectDemoQuestions('CRYPTO', 'beginner')).toHaveLength(3);
    expect(selectDemoQuestions('FINANCE', 'advanced')).toHaveLength(3);
    expect(selectDemoQuestions('BOTH', null)).toHaveLength(3);
  });

  it('priorise la difficulté du niveau en premier', () => {
    const qs = selectDemoQuestions('CRYPTO', 'advanced');
    expect(qs[0].difficulty).toBe('advanced');
  });

  it('ne renvoie pas de doublons d’id', () => {
    const qs = selectDemoQuestions('CRYPTO', 'beginner');
    expect(new Set(qs.map((q) => q.id)).size).toBe(3);
  });

  it('domaine inconnu/null retombe sur CRYPTO sans crasher', () => {
    expect(selectDemoQuestions(null, 'beginner')).toHaveLength(3);
  });
});
