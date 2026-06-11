import { demoQuestions, DemoQuestion, Difficulty } from './demoQuestions';
import { Level, Domain } from '../hooks/useOnboardingStore';

const ORDER: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

export function levelToDifficulty(level: Level | null): Difficulty {
  if (level === 'intermediate') return 'intermediate';
  if (level === 'advanced') return 'advanced';
  return 'beginner';
}

/**
 * Retourne 3 questions pour le domaine, en commençant par celles qui
 * correspondent au niveau, puis en complétant avec les autres difficultés.
 */
export function selectDemoQuestions(domain: Domain | null, level: Level | null): DemoQuestion[] {
  const pool =
    demoQuestions[domain ?? 'CRYPTO'] ??
    demoQuestions.FINANCE ??
    demoQuestions.CRYPTO ??
    [];
  const target = levelToDifficulty(level);

  // Ordre de préférence : niveau cible, puis les autres difficultés.
  const prefOrder: Difficulty[] = [target, ...ORDER.filter((d) => d !== target)];

  const ranked = [...pool].sort(
    (a, b) => prefOrder.indexOf(a.difficulty) - prefOrder.indexOf(b.difficulty),
  );

  return ranked.slice(0, 3);
}
