import React, { useEffect } from 'react';
import { MindyTurn } from '../components/MindyTurn';
import { XpReveal } from '../components/XpReveal';
import { Confetti } from '@/components/animations/Confetti';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

export function ResultStep() {
  const next = useOnboardingStore((s) => s.next);
  const demoScore = useOnboardingStore((s) => s.demoScore);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('hype'); }, [setMood]);

  const xp = demoScore * 10;
  const msg =
    demoScore >= 2 ? `Joli, ${demoScore}/3 ! Tu viens de gagner tes premiers XP 🎉`
    : demoScore === 1 ? `${demoScore}/3 — c'est un début, on va vite progresser 💪`
    : `0/3 cette fois… mais c'est exactement pour ça que t'es là 😉`;

  return (
    <MindyTurn turnKey="result" mood="hype" message={msg} ctaLabel="Sauver ma progression" onCta={next}>
      {/* Confetti uniquement si au moins une bonne réponse (sinon ça sonne faux). */}
      {demoScore > 0 ? <Confetti count={60} active /> : null}
      <XpReveal xp={xp} />
    </MindyTurn>
  );
}
