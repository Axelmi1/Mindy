import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { MindyTurn } from '../components/MindyTurn';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

export function HelloStep() {
  const next = useOnboardingStore((s) => s.next);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('hype'); }, [setMood]);

  return (
    <MindyTurn
      turnKey="hello"
      mood="hype"
      message="Salut 👋 Moi c'est Mindy, ton coach. En 2 min, je te montre comment devenir bon en argent."
      ctaLabel="C'est parti"
      onCta={next}
      secondary={
        <PrimaryButton variant="ghost" onPress={() => router.replace('/login')}>
          J'ai déjà un compte
        </PrimaryButton>
      }
    >
      {null}
    </MindyTurn>
  );
}
