/**
 * ErrorBoundary
 *
 * React class-based error boundary for catching unhandled render errors.
 * Shows a user-friendly screen with a "Retry" option instead of crashing.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourScreen />
 *   </ErrorBoundary>
 *
 * Or wrap the entire app in _layout.tsx.
 */

import React, { Component, ErrorInfo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  children: React.ReactNode;
  /** Optional fallback UI to render instead of the default error screen */
  fallback?: React.ReactNode;
  /** Called when the error is caught — use for Sentry/crash reporting */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Forward to crash reporter (e.g. Sentry)
    this.props.onError?.(error, errorInfo);
    console.error('[ErrorBoundary] Caught unhandled error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) return children;
    if (fallback) return fallback;

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0D1117', '#161B22']}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            An unexpected error occurred. Your progress has been saved.
          </Text>

          {__DEV__ && error && (
            <View style={styles.devBox}>
              <Text style={styles.devTitle}>Dev Info</Text>
              <Text style={styles.devText}>{error.toString()}</Text>
            </View>
          )}

          <Pressable style={styles.retryBtn} onPress={this.handleRetry}>
            <LinearGradient
              colors={['#39FF14', '#2ACC10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryGradient}
            >
              <Text style={styles.retryText}>↻ Try Again</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emoji: { fontSize: 56, marginBottom: 8 },
  title: {
    color: '#E6EDF3',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#8B949E',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  devBox: {
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 81, 73, 0.3)',
    alignSelf: 'stretch',
    marginTop: 8,
  },
  devTitle: {
    color: '#F85149',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  devText: {
    color: '#F85149',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  retryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    alignSelf: 'stretch',
  },
  retryGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 14,
  },
  retryText: {
    color: '#0D1117',
    fontSize: 16,
    fontWeight: '800',
  },
});
