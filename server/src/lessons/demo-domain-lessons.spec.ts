import { CreateLessonSchema, validateLessonContent } from './lesson-content.schema';
import { DEMO_DOMAIN_LESSONS } from './demo-domain-lessons.data';

describe('DEMO_DOMAIN_LESSONS', () => {
  it('contient 1 leçon pour chaque nouveau domaine', () => {
    const domains = DEMO_DOMAIN_LESSONS.map((l) => l.domain).sort();
    expect(domains).toEqual(['ENTREPRENEURSHIP', 'REAL_ESTATE', 'TAXES']);
  });

  it.each(DEMO_DOMAIN_LESSONS)('contenu valide : $title', (lesson) => {
    expect(() => validateLessonContent(lesson.content)).not.toThrow();
  });

  it.each(DEMO_DOMAIN_LESSONS)('passe CreateLessonSchema : $title', (lesson) => {
    const { id, ...input } = lesson;
    expect(CreateLessonSchema.safeParse(input).success).toBe(true);
  });

  it('contient exactement 3 leçons', () => {
    expect(DEMO_DOMAIN_LESSONS).toHaveLength(3);
  });

  it('a des ids uniques', () => {
    const ids = DEMO_DOMAIN_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
