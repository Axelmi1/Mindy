/**
 * Normalisation des étapes de leçon au format legacy.
 *
 * Les premiers Master Tests ont été seedés avec d'anciens formats
 * (fill_blank avec `correctAnswer`, scenario avec `options`/`correctIndex`,
 * calculator avec `targetValue`). Les données sont corrigées côté serveur,
 * mais le cache hors-ligne peut encore contenir l'ancien format : sans
 * normalisation, les vues d'étapes crashent (`choices.map` sur undefined).
 */

import type { LessonStep } from '@mindy/shared';

type AnyStep = Record<string, unknown> & { type?: string };

export function normalizeLegacyStep(step: LessonStep): LessonStep {
  const raw = step as unknown as AnyStep;

  switch (raw.type) {
    case 'fill_blank': {
      const answer = (raw.answer ?? raw.correctAnswer) as string | undefined;
      const choices = Array.isArray(raw.choices) && raw.choices.length > 0
        ? (raw.choices as string[])
        : answer
          ? [answer]
          : [];
      // L'ancien format utilisait 5 underscores ; la vue split sur '___'
      const sentence = typeof raw.sentence === 'string'
        ? raw.sentence.replace(/_{3,}/g, '___')
        : '';
      return { ...raw, sentence, answer: answer ?? '', choices } as LessonStep;
    }

    case 'scenario': {
      if (Array.isArray(raw.choices)) return step;
      const options = Array.isArray(raw.options) ? (raw.options as string[]) : [];
      const correctIndex = typeof raw.correctIndex === 'number' ? raw.correctIndex : 0;
      const situation = [raw.scenario, raw.question]
        .filter((part): part is string => typeof part === 'string' && part.length > 0)
        .join('\n\n') || (typeof raw.situation === 'string' ? raw.situation : '');
      return {
        ...raw,
        situation,
        choices: options.map((text, index) => ({
          text,
          isGood: index === correctIndex,
          explanation: typeof raw.explanation === 'string' ? raw.explanation : '',
        })),
      } as LessonStep;
    }

    case 'calculator': {
      const variables = Array.isArray(raw.variables) ? raw.variables : [];
      const answer = typeof raw.answer === 'number'
        ? raw.answer
        : typeof raw.targetValue === 'number'
          ? raw.targetValue
          : 0;
      return { ...raw, variables, answer } as LessonStep;
    }

    default:
      return step;
  }
}

export function normalizeLegacySteps(steps: LessonStep[]): LessonStep[] {
  return steps.map(normalizeLegacyStep);
}
