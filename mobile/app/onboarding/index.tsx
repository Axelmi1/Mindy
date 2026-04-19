import React from 'react';
import { useOnboardingStore } from './hooks/useOnboardingStore';
import { WelcomeStep } from './steps/WelcomeStep';
import { DomainStep } from './steps/DomainStep';
import { GoalStep } from './steps/GoalStep';
import { TimeStep } from './steps/TimeStep';
import { MindyIntroStep } from './steps/MindyIntroStep';
import { DemoIntroStep } from './steps/DemoIntroStep';
import { DemoQuestionStep } from './steps/DemoQuestionStep';
import { ResultsStep } from './steps/ResultsStep';
import { SignupStep } from './steps/SignupStep';
import { NotificationsStep } from './steps/NotificationsStep';

export default function OnboardingRouter() {
  const currentStep = useOnboardingStore((s) => s.currentStep);

  switch (currentStep) {
    case 'welcome':       return <WelcomeStep />;
    case 'domain':        return <DomainStep />;
    case 'goal':          return <GoalStep />;
    case 'time':          return <TimeStep />;
    case 'mindy_intro':   return <MindyIntroStep />;
    case 'demo_intro':    return <DemoIntroStep />;
    case 'demo_q1':       return <DemoQuestionStep questionIndex={0} stepKey="demo_q1" />;
    case 'demo_q2':       return <DemoQuestionStep questionIndex={1} stepKey="demo_q2" />;
    case 'demo_q3':       return <DemoQuestionStep questionIndex={2} stepKey="demo_q3" />;
    case 'results':       return <ResultsStep />;
    case 'signup':        return <SignupStep />;
    case 'notifications': return <NotificationsStep />;
    default:              return null;
  }
}
