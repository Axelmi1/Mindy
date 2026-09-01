import type { CreateLessonInput } from './lesson-content.schema';
import { REAL_ESTATE_LESSONS } from './real-estate.lessons';
import { TAXES_LESSONS } from './taxes.lessons';
import { ENTREPRENEURSHIP_LESSONS } from './entrepreneurship.lessons';
import { DOMAIN_MASTER_QUIZZES } from './master-quizzes.lessons';
import { DEMO_SHOWCASE_LESSONS } from './demo-showcase.lesson';

/**
 * Leçons des 3 nouveaux domaines (10 par domaine + 1 Master Quiz = 33)
 * + la leçon vitrine du domaine DEMO (soutenance) = 34 au total.
 * Ids fixes → upsert idempotent par `prisma/add-domain-lessons.ts`.
 */
export const DEMO_DOMAIN_LESSONS: Array<{ id: string } & CreateLessonInput> = [
  ...REAL_ESTATE_LESSONS,
  ...TAXES_LESSONS,
  ...ENTREPRENEURSHIP_LESSONS,
  ...DOMAIN_MASTER_QUIZZES,
  ...DEMO_SHOWCASE_LESSONS,
];
