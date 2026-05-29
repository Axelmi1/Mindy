import React from 'react';
import { useOnboardingStore } from './hooks/useOnboardingStore';
import { HelloStep } from './steps/HelloStep';
import { LevelStep } from './steps/LevelStep';
import { DomainStep } from './steps/DomainStep';
import { GoalStep } from './steps/GoalStep';
import { TimeStep } from './steps/TimeStep';
import { DemoQuestionStep } from './steps/DemoQuestionStep';
import { ResultStep } from './steps/ResultStep';
import { SignupStep } from './steps/SignupStep';
import { PlanStep } from './steps/PlanStep';

export default function OnboardingRouter() {
  const currentStep = useOnboardingStore((s) => s.currentStep);

  switch (currentStep) {
    case 'hello':  return <HelloStep />;
    case 'level':  return <LevelStep />;
    case 'domain': return <DomainStep />;
    case 'goal':   return <GoalStep />;
    case 'time':   return <TimeStep />;
    case 'demo':   return <DemoQuestionStep />;
    case 'result': return <ResultStep />;
    case 'signup': return <SignupStep />;
    case 'plan':   return <PlanStep />;
    default:       return <HelloStep />;
  }
}
