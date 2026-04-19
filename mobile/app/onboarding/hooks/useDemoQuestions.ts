import { useMemo } from 'react';
import { demoQuestions, Domain, DemoQuestion } from '../data/demoQuestions';

export function useDemoQuestions(domain: Domain | null): DemoQuestion[] {
  return useMemo(() => (domain ? demoQuestions[domain] : demoQuestions.CRYPTO), [domain]);
}
