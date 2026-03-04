import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { InfoStep } from '@mindy/shared';
import { MindyMessage } from '../MindyMessage';

interface InfoStepViewProps {
  step: InfoStep;
  onContinue: () => void;
}

/**
 * InfoStepView - Displays educational content with optional Mindy message
 */
export function InfoStepView({ step }: InfoStepViewProps) {
  return (
    <View style={styles.container}>
      {/* Mindy Message */}
      {step.mindyMessage && (
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <MindyMessage
            message={step.mindyMessage}
            mood="neutral"
          />
        </Animated.View>
      )}

      {/* Content Card */}
      <Animated.View
        style={styles.contentCard}
        entering={FadeInUp.duration(400).delay(300)}
      >
        {/* Title */}
        <Text style={styles.title}>{step.title}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        <Text style={styles.content}>{step.content}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
  },
  contentCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#30363D',
    marginBottom: 16,
  },
  content: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 26,
    color: '#8B949E',
  },
});
