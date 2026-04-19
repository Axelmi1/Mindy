import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  footer?: React.ReactNode;
  keyboardAware?: boolean;
  animationKey?: string;
}

export function OnboardingScreen({ children, footer, keyboardAware }: Props) {
  const insets = useSafeAreaInsets();

  const body = (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
      {footer && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, justifyContent: 'center' },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 12, backgroundColor: '#0D1117' },
});
