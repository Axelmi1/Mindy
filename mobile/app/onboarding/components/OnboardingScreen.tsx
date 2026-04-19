import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  footer?: React.ReactNode;
  keyboardAware?: boolean;
  animationKey?: string;
}

export function OnboardingScreen({ children, footer, keyboardAware }: Props) {
  const insets = useSafeAreaInsets();

  const inner = (
    <>
      <View style={styles.content}>{children}</View>
      {footer && (
        <View
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}
        >
          {footer}
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  flex1: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
  },
});
