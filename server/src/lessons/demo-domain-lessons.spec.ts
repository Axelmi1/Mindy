import { CreateLessonSchema, validateLessonContent } from './lesson-content.schema';
import { DEMO_DOMAIN_LESSONS } from './demo-domain-lessons.data';

describe('DEMO_DOMAIN_LESSONS', () => {
  it('contient 30 leçons (10 par nouveau domaine)', () => {
    expect(DEMO_DOMAIN_LESSONS).toHaveLength(30);
    const byDomain = DEMO_DOMAIN_LESSONS.reduce<Record<string, number>>((acc, l) => {
      acc[l.domain] = (acc[l.domain] ?? 0) + 1;
      return acc;
    }, {});
    expect(byDomain).toEqual({ REAL_ESTATE: 10, ENTREPRENEURSHIP: 10, TAXES: 10 });
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
