import React, { useEffect } from 'react';
import { MindyTurn } from '../components/MindyTurn';
import { AnswerCards } from '../components/AnswerCards';
import { useOnboardingStore, Level } from '../hooks/useOnboardingStore';

const OPTIONS = [
  { id: 'beginner', label: 'Débutant total', sublabel: 'Je pars de zéro', icon: '🌱' },
  { id: 'intermediate', label: 'Je connais 2-3 trucs', sublabel: 'Les bases, sans plus', icon: '📈' },
  { id: 'advanced', label: 'Je gère déjà', sublabel: 'Montre-moi du lourd', icon: '🚀' },
];

export function LevelStep() {
  const next = useOnboardingStore((s) => s.next);
  const level = useOnboardingStore((s) => s.level);
  const setLevel = useOnboardingStore((s) => s.setLevel);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  return (
    <MindyTurn
      turnKey="level"
      mood="neutral"
      message="D'abord, t'es plutôt… ?"
      ctaLabel="Continuer"
      ctaDisabled={!level}
      onCta={next}
    >
      <AnswerCards options={OPTIONS} selectedId={level} onSelect={(id) => setLevel(id as Level)} />
    </MindyTurn>
  );
}
