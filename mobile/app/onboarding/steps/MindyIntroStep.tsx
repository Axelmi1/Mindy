import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MindyMascot } from '@/components/mindy';
import { MindyMessage } from '@/components/MindyMessage';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const INTRO_TEXT = "Hey! I'm Mindy, your coach. Before we start, let me test you — 3 quick questions, nothing serious. Ready?";

export function MindyIntroStep() {
  const next = useOnboardingStore((s) => s.next);
  const [typingDone, setTypingDone] = useState(false);

  return (
    <OnboardingScreen
      animationKey="mindy_intro"
      footer={
        <PrimaryButton onPress={next} disabled={!typingDone}>Let's go</PrimaryButton>
      }
    >
      <View style={styles.mascotBox}>
        <MindyMascot mood="hype" size={160} />
      </View>

      <Animated.View entering={FadeIn.delay(500)} style={styles.messageBox}>
        <MindyMessage
          message={INTRO_TEXT}
          mood="hype"
          typingSpeed={25}
          onComplete={() => setTypingDone(true)}
        />
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  mascotBox: { alignItems: 'center', marginBottom: 24 },
  messageBox: { marginHorizontal: 8 },
});
