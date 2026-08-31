import { CreateLessonSchema, validateLessonContent } from './lesson-content.schema';
import { DEMO_DOMAIN_LESSONS } from './demo-domain-lessons.data';

describe('DEMO_DOMAIN_LESSONS', () => {
  it('contient 33 leçons (10 + 1 Master Quiz par nouveau domaine)', () => {
    expect(DEMO_DOMAIN_LESSONS).toHaveLength(33);
    const byDomain = DEMO_DOMAIN_LESSONS.reduce<Record<string, number>>((acc, l) => {
      acc[l.domain] = (acc[l.domain] ?? 0) + 1;
      return acc;
    }, {});
    expect(byDomain).toEqual({ REAL_ESTATE: 11, ENTREPRENEURSHIP: 11, TAXES: 11 });
  });

  it('a exactement un Master Quiz par nouveau domaine (200 XP, orderIndex 900)', () => {
    const masters = DEMO_DOMAIN_LESSONS.filter((l) => l.isMasterQuiz);
    expect(masters.map((l) => l.domain).sort()).toEqual([
      'ENTREPRENEURSHIP',
      'REAL_ESTATE',
      'TAXES',
    ]);
    for (const quiz of masters) {
      expect(quiz.xpReward).toBe(200);
      expect(quiz.orderIndex).toBe(900);
      expect(quiz.difficulty).toBe('ADVANCED');
    }
  });

  it('a des ids uniques', () => {
    const ids = DEMO_DOMAIN_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(DEMO_DOMAIN_LESSONS)('contenu valide : $title', (lesson) => {
    expect(() => validateLessonContent(lesson.content)).not.toThrow();
  });

  it.each(DEMO_DOMAIN_LESSONS)('passe CreateLessonSchema : $title', (lesson) => {
    const { id, ...input } = lesson;
    const result = CreateLessonSchema.safeParse(input);
    if (!result.success) {
      throw new Error(`${lesson.id} invalide : ${JSON.stringify(result.error.issues, null, 2)}`);
    }
    expect(result.success).toBe(true);
  });
});
