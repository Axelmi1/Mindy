import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

interface Props {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
}

export function PrimaryButton({ onPress, disabled, loading, children, variant = 'primary' }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        disabled && styles.disabled,
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#0D1117' : '#8B949E'} />
      ) : (
        <View style={styles.content}>
          {typeof children === 'string' ? (
            <Text style={[styles.text, isPrimary ? styles.primaryText : styles.ghostText]}>{children}</Text>
          ) : children}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 18, borderRadius: 999, alignItems: 'center' },
  primary: { backgroundColor: '#39FF14' },
  ghost: { backgroundColor: 'transparent' },
  disabled: { backgroundColor: '#30363D' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: 'Inter', fontSize: 16, fontWeight: '700' },
  primaryText: { color: '#0D1117' },
  ghostText: { color: '#8B949E', fontWeight: '500' },
});
