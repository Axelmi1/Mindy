import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// ============================================================================
// Types
// ============================================================================

interface ContinueCardProps {
  /** Current lesson title */
  lessonTitle: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Domain category */
  domain: 'CRYPTO' | 'FINANCE';
  /** Press handler */
  onPress: () => void;
}

// ============================================================================
// ContinueCard Component
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * ContinueCard - Prominent card for resuming current lesson
 * 
 * Features a terminal-style progress bar and animated play button.
 */
export function ContinueCard({
  lessonTitle,
  progress,
  domain,
  onPress,
}: ContinueCardProps) {
  // Animation values
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  // Setup pulse animation on mount
  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  // Generate terminal-style progress bar
  const progressBarWidth = 20;
  const filledBlocks = Math.round((progress / 100) * progressBarWidth);
  const emptyBlocks = progressBarWidth - filledBlocks;
  const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

  // Domain colors
  const domainColor = domain === 'CRYPTO' ? '#39FF14' : '#58A6FF';

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {/* Left side - Play button */}
      <View style={styles.playButtonContainer}>
        <View style={[styles.playButton, { borderColor: domainColor }]}>
          <Animated.View 
            style={[
              styles.playButtonGlow, 
              { backgroundColor: domainColor },
              pulseStyle
            ]} 
          />
          <Text style={[styles.playIcon, { color: domainColor }]}>▶</Text>
        </View>
      </View>

      {/* Right side - Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.continueLabel}>CONTINUE</Text>
          <View style={[styles.domainBadge, { backgroundColor: domainColor + '20' }]}>
            <Text style={[styles.domainText, { color: domainColor }]}>
              {domain}
            </Text>
          </View>
        </View>

        {/* Lesson title */}
        <Text style={styles.title} numberOfLines={1}>
          {lessonTitle}
        </Text>

        {/* Progress bar (terminal style) */}
        <View style={styles.progressContainer}>
          <Text style={[styles.progressBar, { color: domainColor }]}>
            [{progressBar}]
          </Text>
          <Text style={styles.progressText}>
            {progress}%
          </Text>
        </View>

        {/* Loading text animation */}
        <Text style={styles.loadingText}>
          LOADING KNOWLEDGE...
        </Text>
      </View>
    </AnimatedPressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButtonContainer: {
    marginRight: 16,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#21262D',
    overflow: 'hidden',
  },
  playButtonGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  playIcon: {
    fontSize: 20,
    marginLeft: 4, // Visual centering for play icon
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  continueLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '600',
    letterSpacing: 1,
  },
  domainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  domainText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#E6EDF3',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    letterSpacing: -1,
  },
  progressText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#E6EDF3',
    fontWeight: 'bold',
  },
  loadingText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#484F58',
    marginTop: 4,
    letterSpacing: 1,
  },
});

export default ContinueCard;

