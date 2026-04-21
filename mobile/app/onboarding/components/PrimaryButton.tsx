import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

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
        style={{
          paddingVertical: 14,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: '500',
            color: '#8B949E',
          }}
        >
          {typeof children === 'string' ? children : null}
        </Text>
      </Pressable>
    );
  }

  if (isDisabled) {
    return (
      <View
        style={{
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: '#39FF14',
          borderRadius: 999,
          minHeight: 56,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 24,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#39FF14" />
        ) : (
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 16,
              fontWeight: '700',
              color: '#39FF14',
            }}
          >
            {typeof children === 'string' ? children : null}
          </Text>
        )}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#39FF14',
        borderRadius: 999,
        minHeight: 56,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: '700',
          color: '#0D1117',
        }}
      >
        {typeof children === 'string' ? children : null}
      </Text>
    </Pressable>
  );
}
