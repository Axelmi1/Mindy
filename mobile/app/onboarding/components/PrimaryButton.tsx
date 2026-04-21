import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';

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
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.6}
        style={styles.ghost}
      >
        {typeof children === 'string' ? (
          <Text style={styles.ghostText}>{children}</Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  }

  if (isDisabled) {
    return (
      <View style={styles.primaryDisabled}>
        {loading ? (
          <ActivityIndicator color="#39FF14" />
        ) : (
          <Text style={styles.primaryDisabledText}>
            {typeof children === 'string' ? children : null}
          </Text>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.primary}
    >
      <Text style={styles.primaryText}>
        {typeof children === 'string' ? children : null}
      </Text>
    </TouchableOpacity>
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
    width: '100%',
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
    width: '100%',
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
    width: '100%',
  },
  ghostText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#8B949E',
  },
});
