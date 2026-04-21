import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';

interface Props {
  children: React.ReactNode;
  footer?: React.ReactNode;
  keyboardAware?: boolean;
  animationKey?: string;
}

export function OnboardingScreen({ children, footer, keyboardAware }: Props) {
  const body = (
    <>
      <View style={styles.content}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </>
  );

  return (
    <View style={styles.root}>
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D1117',
    paddingTop: 60,
  },
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
    paddingBottom: 40,
    gap: 12,
  },
});
