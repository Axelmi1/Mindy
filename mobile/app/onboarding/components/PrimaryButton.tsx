import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

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

  const backgroundColor = isDisabled
    ? '#30363D'
    : isPrimary
      ? '#39FF14'
      : 'transparent';

  const textColor = isDisabled
    ? '#484F58'
    : isPrimary
      ? '#0D1117'
      : '#8B949E';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        backgroundColor,
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        minHeight: 56,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : typeof children === 'string' ? (
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: '700',
            color: textColor,
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
