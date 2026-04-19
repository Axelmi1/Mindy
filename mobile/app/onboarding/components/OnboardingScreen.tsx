import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  footer?: React.ReactNode;
  keyboardAware?: boolean;
  animationKey?: string;
}

export function OnboardingScreen({ children, footer, keyboardAware, animationKey }: Props) {
  const Wrapper = keyboardAware ? KeyboardAvoidingView : View;

  return (
    <SafeAreaView style={styles.root}>
      <Wrapper
        style={{ flex: 1 }}
        {...(keyboardAware ? { behavior: Platform.OS === 'ios' ? 'padding' : 'height' } : {})}
      >
        <Animated.View
          key={animationKey}
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(200)}
          style={styles.content}
        >
          {children}
        </Animated.View>
        {footer && <View style={styles.footer}>{footer}</View>}
      </Wrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
});
