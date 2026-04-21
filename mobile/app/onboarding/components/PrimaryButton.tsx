import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';

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
  const isDisabled = !!disabled || !!loading;

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.ghost,
          pressed && styles.pressed,
        ]}
      >
        {typeof children === 'string' ? (
          <Text style={styles.ghostText}>{children}</Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }

  const btnStyle = isDisabled ? styles.primaryDisabled : styles.primary;
  const textStyle = isDisabled ? styles.primaryDisabledText : styles.primaryText;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [btnStyle, pressed && styles.pressed]}
    >
      {loading ? (
        <ActivityIndicator color="#0D1117" />
      ) : typeof children === 'string' ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        <View>{children}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: '#39FF14',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#39FF14',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  primaryDisabledText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#39FF14',
  },
  ghost: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#8B949E',
  },
  pressed: {
    opacity: 0.8,
  },
});
