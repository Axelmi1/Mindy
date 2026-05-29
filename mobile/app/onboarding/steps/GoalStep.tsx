import React, { useEffect } from 'react';
import { MindyTurn } from '../components/MindyTurn';
import { AnswerCards } from '../components/AnswerCards';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const OPTIONS = [
  { id: 'invest', label: 'Commencer à investir', icon: '📈' },
  { id: 'understand', label: 'Comprendre les bases', icon: '🧠' },
  { id: 'career', label: 'Booster ma carrière', icon: '🚀' },
  { id: 'curiosity', label: 'Juste curieux', icon: '🔍' },
];

export function GoalStep() {
  const next = useOnboardingStore((s) => s.next);
  const goal = useOnboardingStore((s) => s.goal);
  const setGoal = useOnboardingStore((s) => s.setGoal);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  return (
    <MindyTurn
      turnKey="goal"
      mood="neutral"
      message="Et pourquoi ? Ça m'aide à personnaliser tout ça."
      ctaLabel="Continuer"
      ctaDisabled={!goal}
      onCta={next}
    >
      <AnswerCards options={OPTIONS} selectedId={goal} onSelect={setGoal} />
    </MindyTurn>
  );
}
