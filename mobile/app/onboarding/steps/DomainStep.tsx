import React, { useEffect } from 'react';
import { MindyTurn } from '../components/MindyTurn';
import { AnswerCards } from '../components/AnswerCards';
import { useOnboardingStore, Domain } from '../hooks/useOnboardingStore';

const OPTIONS = [
  { id: 'CRYPTO', label: 'Crypto', sublabel: 'Bitcoin, blockchain, DeFi', icon: '⛓️' },
  { id: 'FINANCE', label: 'Finance', sublabel: 'Investir, budget, bourse', icon: '💰' },
  { id: 'BOTH', label: 'Les deux', sublabel: 'Pourquoi choisir ?', icon: '✨' },
];

export function DomainStep() {
  const next = useOnboardingStore((s) => s.next);
  const domain = useOnboardingStore((s) => s.domain);
  const setDomain = useOnboardingStore((s) => s.setDomain);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  return (
    <MindyTurn
      turnKey="domain"
      mood="neutral"
      message="Tu veux apprendre quoi en premier ?"
      ctaLabel="Continuer"
      ctaDisabled={!domain}
      onCta={next}
    >
      <AnswerCards options={OPTIONS} selectedId={domain} onSelect={(id) => setDomain(id as Domain)} />
    </MindyTurn>
  );
}
