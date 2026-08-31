import { CreateLessonSchema, validateLessonContent } from './lesson-content.schema';
import { MASTER_QUIZZES } from '../../prisma/seed-master-quizzes';

/**
 * Les Master Tests historiques (CRYPTO/FINANCE/TRADING) sont seedés par
 * prisma/seed-master-quizzes.ts sans passer par l'API — ce spec garantit
 * que leur contenu respecte quand même le schéma (des étapes au format
 * legacy faisaient crasher le lecteur de leçons mobile).
 */
describe('MASTER_QUIZZES (seed legacy)', () => {
  it('contient les 3 Master Tests historiques', () => {
    expect(MASTER_QUIZZES.map((q) => q.domain).sort()).toEqual([
      'CRYPTO',
      'FINANCE',
      'TRADING',
    ]);
    for (const quiz of MASTER_QUIZZES) {
      expect(quiz.isMasterQuiz).toBe(true);
      expect(quiz.xpReward).toBe(200);
    }
  });

  it.each(MASTER_QUIZZES)('contenu valide : $title', (quiz) => {
    expect(() => validateLessonContent(quiz.content)).not.toThrow();
  });

  it.each(MASTER_QUIZZES)('passe CreateLessonSchema : $title', (quiz) => {
    const result = CreateLessonSchema.safeParse(quiz);
    if (!result.success) {
      throw new Error(`${quiz.title} invalide : ${JSON.stringify(result.error.issues, null, 2)}`);
    }
    expect(result.success).toBe(true);
  });
});
