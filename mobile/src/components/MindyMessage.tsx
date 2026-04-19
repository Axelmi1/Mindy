import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MindyMascot } from './mindy';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ============================================================================
// Types
// ============================================================================

type MindyMood = 'neutral' | 'hype' | 'roast' | 'thinking';

interface MindyMessageProps {
  /** The message to display */
  message: string;
  /** Typing speed in ms per character (default: 30) */
  typingSpeed?: number;
  /** Mindy's mood affects styling */
  mood?: MindyMood;
  /** Show prefix [MINDY]> (default: true) */
  showPrefix?: boolean;
  /** Callback when typing animation completes */
  onComplete?: () => void;
  /** Enable haptic feedback during typing */
  hapticFeedback?: boolean;
  /** Render the mascot next to the message card (default false) */
  showMascot?: boolean;
  /** Mascot size in px (default 64) */
  mascotSize?: number;
}

// ============================================================================
// Mood Configurations
// ============================================================================

const moodConfig: Record<MindyMood, { emoji: string; prefixColor: string }> = {
  neutral: { emoji: '', prefixColor: '#39FF14' },
  hype: { emoji: ' 🚀', prefixColor: '#39FF14' },
  roast: { emoji: ' 🔥', prefixColor: '#F78166' },
  thinking: { emoji: ' 🤔', prefixColor: '#58A6FF' },
};

// ============================================================================
// MindyMessage Component
// ============================================================================

/**
 * MindyMessage - Terminal-style typing animation component
 * 
 * Displays text with a character-by-character typing effect,
 * blinking cursor, and optional haptic feedback.
 * 
 * @example
 * <MindyMessage 
 *   message="Welcome to MINDY!" 
 *   mood="hype"
 *   onComplete={() => console.log('Done!')}
 * />
 */
export function MindyMessage({
  message,
  typingSpeed = 30,
  mood = 'neutral',
  showPrefix = true,
  onComplete,
  hapticFeedback = false,
  showMascot = false,
  mascotSize = 64,
}: MindyMessageProps) {
  // State for displayed text
  const [displayText, setDisplayText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Animation values
  const charIndex = useSharedValue(0);
  const cursorOpacity = useSharedValue(1);

  // Get mood configuration
  const { emoji, prefixColor } = moodConfig[mood];
  const fullMessage = `${message}${emoji}`;

  // Handle completion callback
  const handleComplete = useCallback(() => {
    setIsTypingComplete(true);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticFeedback]);

  // Typing animation effect
  useEffect(() => {
    // Reset state on message change
    setDisplayText('');
    setIsTypingComplete(false);
    charIndex.value = 0;

    // Animate character by character
    charIndex.value = withTiming(
      fullMessage.length,
      {
        duration: fullMessage.length * typingSpeed,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(handleComplete)();
        }
      }
    );

    // Blinking cursor animation (continuous)
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(1, { duration: 400 })
      ),
      -1,
      true
    );
  }, [fullMessage, typingSpeed, handleComplete]);

  // Update displayed text based on animation progress
  useEffect(() => {
    let frame: number;
    let lastIndex = 0;

    const updateText = () => {
      const currentIndex = Math.floor(charIndex.value);
      
      if (currentIndex !== lastIndex && currentIndex <= fullMessage.length) {
        setDisplayText(fullMessage.slice(0, currentIndex));
        lastIndex = currentIndex;
        
        // Haptic feedback on each character
        if (hapticFeedback && currentIndex > 0) {
          triggerHaptic();
        }
      }
      
      if (currentIndex < fullMessage.length) {
        frame = requestAnimationFrame(updateText);
      }
    };

    frame = requestAnimationFrame(updateText);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [fullMessage, hapticFeedback, triggerHaptic]);

  // Cursor animated style
  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const terminalCard = (
    <View style={styles.terminalFrame}>
      {/* Terminal header dots */}
      <View style={styles.terminalHeader}>
        <View style={[styles.dot, { backgroundColor: '#F85149' }]} />
        <View style={[styles.dot, { backgroundColor: '#F7C843' }]} />
        <View style={[styles.dot, { backgroundColor: '#39FF14' }]} />
      </View>

      {/* Message content */}
      <View style={styles.messageContainer}>
        {showPrefix && (
          <Text style={[styles.prefix, { color: prefixColor }]}>
            [MINDY]{'>'}{' '}
          </Text>
        )}
        <View style={styles.textWrapper}>
          <Text style={styles.messageText}>
            {displayText}
          </Text>
          <Animated.Text style={[styles.cursor, cursorStyle]}>
            _
          </Animated.Text>
        </View>
      </View>
    </View>
  );

  if (showMascot) {
    return (
      <View style={styles.rowContainer}>
        <MindyMascot mood={mood} size={mascotSize} />
        <View style={styles.rowCard}>
          {terminalCard}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {terminalCard}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  terminalFrame: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#21262D',
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  messageContainer: {
    flexDirection: 'row',
    padding: 16,
    flexWrap: 'wrap',
  },
  prefix: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  messageText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#E6EDF3',
    lineHeight: 22,
  },
  cursor: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#39FF14',
    fontWeight: 'bold',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  rowCard: {
    flex: 1,
  },
});

export default MindyMessage;
