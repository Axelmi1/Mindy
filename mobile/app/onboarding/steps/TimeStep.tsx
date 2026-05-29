import React, { useEffect } from 'react';
import { MindyTurn } from '../components/MindyTurn';
import { AnswerCards } from '../components/AnswerCards';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const OPTIONS = [
  { id: '5', label: '5 min / jour', sublabel: 'Tranquille', icon: '☕' },
  { id: '10', label: '10 min / jour', sublabel: 'Régulier', icon: '🔥' },
  { id: '15', label: '15 min / jour', sublabel: 'Sérieux', icon: '⚡' },
];

export function TimeStep() {
  const next = useOnboardingStore((s) => s.next);
  const dailyMinutes = useOnboardingStore((s) => s.dailyMinutes);
  const setDailyMinutes = useOnboardingStore((s) => s.setDailyMinutes);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  return (
    <MindyTurn
      turnKey="time"
      mood="neutral"
      message="Combien de temps par jour ? 5 min suffisent si tu reviens tous les jours 🔥"
      ctaLabel="Continuer"
      ctaDisabled={!dailyMinutes}
      onCta={next}
    >
      <AnswerCards
        options={OPTIONS}
        selectedId={dailyMinutes ? String(dailyMinutes) : null}
        onSelect={(id) => setDailyMinutes(Number(id) as 5 | 10 | 15)}
      />
    </MindyTurn>
  );
}
