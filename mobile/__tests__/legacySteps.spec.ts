import { normalizeLegacyStep, normalizeLegacySteps } from '../src/utils/legacySteps';
import type { LessonStep } from '@mindy/shared';

const asStep = (value: Record<string, unknown>) => value as unknown as LessonStep;

describe('normalizeLegacyStep', () => {
  it('laisse intactes les étapes déjà au bon format', () => {
    const step = asStep({
      type: 'fill_blank',
      sentence: 'Le PTZ est un prêt à taux ___.',
      answer: 'zéro',
      choices: ['zéro', 'fixe'],
    });

    expect(normalizeLegacyStep(step)).toEqual(step);
  });

  it('convertit un fill_blank legacy (correctAnswer, 5 underscores, sans choices)', () => {
    const legacy = asStep({
      type: 'fill_blank',
      sentence: "Un smart contract s'exécute _____ sur la blockchain.",
      correctAnswer: 'automatiquement',
      hint: 'Sans intermédiaire',
    });

    const normalized = normalizeLegacyStep(legacy) as {
      sentence: string;
      answer: string;
      choices: string[];
    };

    expect(normalized.sentence).toBe("Un smart contract s'exécute ___ sur la blockchain.");
    expect(normalized.answer).toBe('automatiquement');
    expect(normalized.choices).toEqual(['automatiquement']);
  });

  it('convertit un scenario legacy (options/correctIndex) en choices', () => {
    const legacy = asStep({
      type: 'scenario',
      title: 'Décision',
      scenario: 'Tu détiens 1 ETH.',
      question: 'Que fais-tu ?',
      options: ['Tout vendre', 'Vendre 50 %', 'Tout garder'],
      correctIndex: 1,
      explanation: 'La vente partielle est prudente.',
    });

    const normalized = normalizeLegacyStep(legacy) as {
      situation: string;
      choices: Array<{ text: string; isGood: boolean; explanation: string }>;
    };

    expect(normalized.situation).toBe('Tu détiens 1 ETH.\n\nQue fais-tu ?');
    expect(normalized.choices).toHaveLength(3);
    expect(normalized.choices[1]).toEqual({
      text: 'Vendre 50 %',
      isGood: true,
      explanation: 'La vente partielle est prudente.',
    });
    expect(normalized.choices[0].isGood).toBe(false);
  });

  it('convertit un calculator legacy (targetValue, sans variables)', () => {
    const legacy = asStep({
      type: 'calculator',
      question: 'Capital final ?',
      initialValue: 5000,
      targetValue: 10794,
      tolerance: 200,
      unit: '€',
    });

    const normalized = normalizeLegacyStep(legacy) as {
      variables: string[];
      answer: number;
    };

    expect(normalized.variables).toEqual([]);
    expect(normalized.answer).toBe(10794);
  });

  it('ne touche pas aux autres types', () => {
    const quiz = asStep({
      type: 'quiz',
      question: 'Q ?',
      options: ['a', 'b'],
      correctIndex: 0,
    });

    expect(normalizeLegacyStep(quiz)).toBe(quiz);
  });

  it('normalise une liste complète', () => {
    const steps = [
      asStep({ type: 'info', title: 'T', content: 'C' }),
      asStep({ type: 'fill_blank', sentence: 'X _____', correctAnswer: 'y' }),
    ];

    const normalized = normalizeLegacySteps(steps);

    expect(normalized[0]).toBe(steps[0]);
    expect((normalized[1] as { choices: string[] }).choices).toEqual(['y']);
  });
});
