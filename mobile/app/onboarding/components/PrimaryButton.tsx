import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
}

export function PrimaryButton({
  onPress,
  disabled,
  loading,
  children,
  variant = 'primary',
}: Props) {
  const isPrimary = variant === 'primary';
  const isDisabled = !!disabled || !!loading;

  const style = [
    styles.base,
    isPrimary ? styles.primary : styles.ghost,
    isDisabled && isPrimary && styles.primaryDisabled,
  ];

  const textStyle = [
    styles.text,
    isPrimary ? styles.primaryText : styles.ghostText,
    isDisabled && isPrimary && styles.primaryDisabledText,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        ...style,
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#0D1117' : '#8B949E'} />
      ) : typeof children === 'string' ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primary: {
    backgroundColor: '#39FF14',
  },
  primaryDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#39FF14',
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    minHeight: 0,
  },
  text: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryText: {
    color: '#0D1117',
  },
  primaryDisabledText: {
    color: '#39FF14',
  },
  ghostText: {
    color: '#8B949E',
    fontWeight: '500',
    fontSize: 14,
  },
});
