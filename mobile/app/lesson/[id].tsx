import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  FadeInUp,
  FadeInDown,
  ZoomIn,
  BounceIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Lesson, LessonStep, UserProgress } from '@mindy/shared';
import { lessonsApi, progressApi, usersApi } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/hooks/useSound';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MindyMessage } from '@/components/MindyMessage';
import { Icon } from '@/components/ui/Icon';
import { ComboBanner } from '@/components/ui/ComboBanner';
import { Confetti, XpCounter, LevelUpCelebration, StreakFire } from '@/components/animations';
import {
  InfoStepView,
  QuizStepView,
  SwipeStepView,
  SwipeSequenceStepView,
  ReorderStepView,
  VisualPickStepView,
  MatchPairsStepView,
  FillBlankStepView,
  CalculatorStepView,
  ScenarioStepView,
  PricePredictionStepView,
  SpeedRoundStepView,
  BudgetAllocatorStepView,
  NewsImpactStepView,
  FlashcardStepView,
  WordScrambleStepView,
  DragSortStepView,
  SpotTheScamStepView,
  ConnectDotsStepView,
  TimelineBuilderStepView,
} from '@/components/steps';

type ScreenState = 'loading' | 'ready' | 'playing' | 'feedback' | 'completed' | 'error';

// Micro-messages de Mindy selon le contexte
const STREAK_MESSAGES = [
  { streak: 3, messages: ["3 d'affilée !", "Tu gères !", "On fire !"] },
  { streak: 5, messages: ["5 de suite ! Impressionnant !", "Tu es en feu !", "Inarrêtable !"] },
  { streak: 7, messages: ["7 ! Tu es une machine !", "Légendaire !", "Mode beast activé !"] },
  { streak: 10, messages: ["10 ! GODLIKE !", "Tu es un génie !", "Perfection !"] },
];

const CORRECT_MESSAGES = [
  "Bien joué !",
  "Exact !",
  "C'est ça !",
  "Parfait !",
  "Tu assures !",
  "Bravo !",
  "Nickel !",
];

const WRONG_MESSAGES = [
  "Pas tout à fait...",
  "Presque !",
  "On va revoir ça.",
  "C'est pas grave, on réessaie.",
  "Tu vas y arriver !",
];

const RETRY_MESSAGES = [
  "On reprend les erreurs !",
  "Deuxième chance !",
  "Cette fois c'est la bonne !",
  "Allez, on boucle ça !",
];

/**
 * LessonScreen - Full lesson player with Duolingo-style error correction loop
 */
export default function LessonScreen() {
  const { id, practice } = useLocalSearchParams<{ id: string; practice?: string }>();
  const isPracticeMode = practice === 'true';
  const { userId, isLoading: isUserLoading } = useUser();
  const { play: playSound } = useSound();

  // Core state
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step queue system (Duolingo-style)
  const [stepQueue, setStepQueue] = useState<number[]>([]); // Indices of steps to complete
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [erroredSteps, setErroredSteps] = useState<Set<number>>(new Set()); // Steps that need retry
  const [completedInSession, setCompletedInSession] = useState<Set<number>>(new Set()); // Steps completed correctly this session
  const [isRetryPhase, setIsRetryPhase] = useState(false);

  // Feedback state
  const [streak, setStreak] = useState(0);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackExplanation, setFeedbackExplanation] = useState('');
  const [showStreakBadge, setShowStreakBadge] = useState(false);

  // Completion state
  const [xpAwarded, setXpAwarded] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1.0);
  const [bonusXp, setBonusXp] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const previousLevelRef = useRef<number | null>(null);

  // Animation key
  const [stepKey, setStepKey] = useState(0);

  // Computed values
  const totalSteps = lesson?.content.steps.length ?? 0;
  const currentStepIndex = stepQueue[currentQueueIndex];
  const currentStep = lesson?.content.steps[currentStepIndex];

  // Progress calculation: completed steps / total unique steps needed
  const uniqueStepsNeeded = totalSteps + erroredSteps.size;
  const progressPercent = uniqueStepsNeeded > 0
    ? (completedInSession.size / totalSteps) * 100
    : 0;

  // Get random message from array
  const getRandomMessage = (messages: string[]) => {
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Get streak message if applicable
  const getStreakMessage = (currentStreak: number) => {
    const streakConfig = STREAK_MESSAGES.find(s => s.streak === currentStreak);
    if (streakConfig) {
      return getRandomMessage(streakConfig.messages);
    }
    return null;
  };

  // Load lesson data
  useEffect(() => {
    if (!id || !userId || isUserLoading) return;

    const loadLesson = async () => {
      try {
        setScreenState('loading');

        const lessonRes = await lessonsApi.getById(id);
        if (!lessonRes.success || !lessonRes.data) {
          throw new Error('Lesson not found');
        }
        setLesson(lessonRes.data);

        // Store current user level for level up detection
        const statsRes = await usersApi.getStats(userId);
        if (statsRes.success && statsRes.data) {
          previousLevelRef.current = statsRes.data.level;
        }

        // Initialize step queue with all step indices
        const allSteps = lessonRes.data.content.steps.map((_, i) => i);
        setStepQueue(allSteps);

        // Try to get existing progress
        try {
          const progressRes = await progressApi.getByUserAndLesson(userId, id);
          if (progressRes.success && progressRes.data) {
            setProgress(progressRes.data);
          }
        } catch {
          // No progress yet
        }

        setScreenState('ready');
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
        setScreenState('error');
      }
    };

    loadLesson();
  }, [id, userId, isUserLoading]);

  // Start the lesson
  const handleStart = useCallback(async () => {
    if (!lesson || !id || !userId) return;

    try {
      if (!progress) {
        const res = await progressApi.create({ userId, lessonId: id });
        if (res.success && res.data) {
          setProgress(res.data);
        }
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setScreenState('playing');
    } catch (err) {
      console.error('Error starting lesson:', err);
    }
  }, [lesson, id, userId, progress]);

  // Handle step completion (called by step components)
  const handleStepComplete = useCallback(async (isCorrect?: boolean) => {
    if (!lesson || !progress || currentStepIndex === undefined) return;

    const stepIndex = currentStepIndex;
    const isInteractiveStep = currentStep?.type !== 'info';

    // Play sound
    if (isInteractiveStep) {
      if (isCorrect === true) {
        playSound('correct');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (isCorrect === false) {
        playSound('wrong');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    // Get explanation from step (for swipe and quiz types)
    const stepExplanation = (currentStep as any)?.explanation || '';

    // Update streak and feedback
    if (isInteractiveStep) {
      if (isCorrect === true) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setLastAnswerCorrect(true);

        // Add to completed
        setCompletedInSession(prev => new Set(prev).add(stepIndex));

        // Remove from errored if it was there
        if (erroredSteps.has(stepIndex)) {
          setErroredSteps(prev => {
            const next = new Set(prev);
            next.delete(stepIndex);
            return next;
          });
        }

        // Set feedback message
        const streakMsg = getStreakMessage(newStreak);
        if (streakMsg) {
          setFeedbackMessage(streakMsg);
          setShowStreakBadge(true);
        } else {
          setFeedbackMessage(getRandomMessage(CORRECT_MESSAGES));
          setShowStreakBadge(false);
        }
        setFeedbackExplanation(stepExplanation);
      } else if (isCorrect === false) {
        setStreak(0);
        setLastAnswerCorrect(false);
        setFeedbackMessage(getRandomMessage(WRONG_MESSAGES));
        setFeedbackExplanation(stepExplanation);
        setShowStreakBadge(false);

        // Add to errored steps (will retry at end)
        if (!isRetryPhase || !erroredSteps.has(stepIndex)) {
          setErroredSteps(prev => new Set(prev).add(stepIndex));
        }
      }

      // Show feedback screen - wait for user to tap Continue
      setScreenState('feedback');
    } else {
      // Info steps - just advance
      setCompletedInSession(prev => new Set(prev).add(stepIndex));
      advanceToNextStep();
    }
  }, [lesson, progress, currentStepIndex, currentStep, streak, erroredSteps, isRetryPhase, playSound]);

  // Advance to next step or handle completion
  const advanceToNextStep = useCallback(async () => {
    const nextQueueIndex = currentQueueIndex + 1;

    if (nextQueueIndex < stepQueue.length) {
      // More steps in queue
      setCurrentQueueIndex(nextQueueIndex);
      setStepKey(prev => prev + 1);
      setScreenState('playing');
    } else {
      // Queue exhausted - check if we need retry phase
      if (erroredSteps.size > 0 && !isRetryPhase) {
        // Start retry phase with errored steps
        const retrySteps = Array.from(erroredSteps);
        setStepQueue(retrySteps);
        setCurrentQueueIndex(0);
        setStepKey(prev => prev + 1);
        setIsRetryPhase(true);
        setFeedbackMessage(getRandomMessage(RETRY_MESSAGES));
        setScreenState('feedback');

        setTimeout(() => {
          setScreenState('playing');
        }, 2000);
      } else if (erroredSteps.size > 0) {
        // Still have errors in retry phase - keep retrying
        const retrySteps = Array.from(erroredSteps);
        setStepQueue(retrySteps);
        setCurrentQueueIndex(0);
        setStepKey(prev => prev + 1);
        setScreenState('playing');
      } else {
        // All done! Complete the lesson
        await completeLesson();
      }
    }
  }, [currentQueueIndex, stepQueue, erroredSteps, isRetryPhase]);

  // Complete the lesson
  const completeLesson = useCallback(async () => {
    if (!lesson) return;

    // Practice mode: celebrate without updating server progress or awarding XP
    if (isPracticeMode) {
      playSound('complete');
      setXpAwarded(0);
      setShowConfetti(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScreenState('completed');
      return;
    }

    if (!progress || !userId) return;

    try {
      // Mark all steps as completed via API
      for (let i = 0; i < totalSteps; i++) {
        await progressApi.completeStep(progress.id, i);
      }

      // Get final result
      const finalRes = await progressApi.completeStep(progress.id, totalSteps - 1);

      if (finalRes.success && finalRes.data) {
        // Backend returns combo fields in addition to UserProgress type
        const comboData = finalRes.data as typeof finalRes.data & {
          comboCount?: number;
          comboMultiplier?: number;
          bonusXp?: number;
        };
        setXpAwarded(comboData.xpAwarded || lesson.xpReward);
        if (comboData.comboCount && comboData.comboCount >= 3) {
          setComboCount(comboData.comboCount);
          setComboMultiplier(comboData.comboMultiplier ?? 1.0);
          setBonusXp(comboData.bonusXp ?? 0);
        }

        // Check for level up
        const statsRes = await usersApi.getStats(userId);
        if (statsRes.success && statsRes.data) {
          const currentLevel = statsRes.data.level;
          if (previousLevelRef.current !== null && currentLevel > previousLevelRef.current) {
            setNewLevel(currentLevel);
            playSound('levelUp');
            setTimeout(() => setShowLevelUp(true), 1000);
          }
        }
      }

      playSound('complete');
      setShowConfetti(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScreenState('completed');
    } catch (err) {
      console.error('Error completing lesson:', err);
      setScreenState('completed');
    }
  }, [progress, userId, lesson, totalSteps, playSound, isPracticeMode]);

  // Handle continue button for info steps
  const handleContinue = useCallback(() => {
    handleStepComplete();
  }, [handleStepComplete]);

  // Render current step
  const renderStep = () => {
    if (!currentStep) return null;

    switch (currentStep.type) {
      case 'info':
        return <InfoStepView key={stepKey} step={currentStep} onContinue={handleContinue} />;
      case 'quiz':
        return <QuizStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'swipe':
        return <SwipeStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'swipe_sequence':
        return <SwipeSequenceStepView key={stepKey} step={currentStep} onComplete={handleStepComplete} />;
      case 'reorder':
        return <ReorderStepView key={stepKey} step={currentStep} onComplete={handleStepComplete} />;
      case 'visual_pick':
        return <VisualPickStepView key={stepKey} step={currentStep} onComplete={handleStepComplete} />;
      case 'match_pairs':
        return <MatchPairsStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'fill_blank':
        return <FillBlankStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'calculator':
        return <CalculatorStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'scenario':
        return <ScenarioStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'price_prediction':
        return <PricePredictionStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'speed_round':
        return <SpeedRoundStepView key={stepKey} step={currentStep} onComplete={handleStepComplete} />;
      case 'budget_allocator':
        return <BudgetAllocatorStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'news_impact':
        return <NewsImpactStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'flashcard':
        return <FlashcardStepView key={stepKey} step={currentStep} onContinue={handleContinue} />;
      case 'word_scramble':
        return <WordScrambleStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'drag_sort':
        return <DragSortStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'spot_the_scam':
        return <SpotTheScamStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'connect_dots':
        return <ConnectDotsStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      case 'timeline_builder':
        return <TimelineBuilderStepView key={stepKey} step={currentStep} onAnswer={handleStepComplete} />;
      default:
        return null;
    }
  };

  // Loading states
  if (isUserLoading || screenState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#39FF14" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userId) {
    router.replace('/login');
    return null;
  }

  if (screenState === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <MindyMessage message={`Oops! ${error || 'Something went wrong.'}`} mood="roast" />
          <Pressable style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Ready state
  if (screenState === 'ready' && lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Icon name="arrow-left" size={20} color="#8B949E" />
          </Pressable>
          <View style={styles.headerSpacer} />
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Icon name="x" size={20} color="#8B949E" />
          </Pressable>
        </View>

        <View style={styles.readyContent}>
          <Animated.View entering={FadeIn.duration(400)}>
            <MindyMessage message={`Prêt pour "${lesson.title}" ? C'est parti !`} mood="hype" />
          </Animated.View>

          <Animated.View style={styles.lessonInfo} entering={FadeInUp.delay(200)}>
            {isPracticeMode && (
              <View style={styles.practiceModeBanner}>
                <Text style={styles.practiceModeText}>🔄 Mode Pratique — Aucun XP</Text>
              </View>
            )}
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <View style={styles.lessonMeta}>
              <View style={[styles.badge, {
                backgroundColor:
                  lesson.domain === 'CRYPTO' ? '#39FF14'
                  : lesson.domain === 'TRADING' ? '#FF8C00'
                  : '#58A6FF'
              }]}>
                <Text style={styles.badgeText}>{lesson.domain}</Text>
              </View>
              <Text style={styles.metaText}>{totalSteps} steps</Text>
              {!isPracticeMode && <Text style={styles.metaText}>+{lesson.xpReward} XP</Text>}
            </View>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Commencer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Feedback state (between steps)
  if (screenState === 'feedback') {
    const feedbackColor = lastAnswerCorrect ? '#39FF14' : '#F85149';
    const feedbackBgColor = lastAnswerCorrect
      ? 'rgba(57, 255, 20, 0.1)'
      : 'rgba(248, 81, 73, 0.1)';

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.feedbackScrollView}
          contentContainerStyle={styles.feedbackScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={BounceIn.duration(400)}
            style={styles.feedbackCard}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
            )}
            <LinearGradient
              colors={[feedbackBgColor, 'rgba(22, 27, 34, 0.95)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.feedbackBorder, { borderColor: feedbackColor }]} />

            {/* Icon */}
            <Animated.View
              entering={ZoomIn.delay(100).duration(300)}
              style={[styles.feedbackIconContainer, { backgroundColor: feedbackBgColor }]}
            >
              <Icon
                name={lastAnswerCorrect ? 'check' : 'x'}
                size={36}
                color={feedbackColor}
              />
            </Animated.View>

            {/* Message */}
            <Animated.Text
              entering={FadeInUp.delay(150)}
              style={[styles.feedbackText, { color: feedbackColor }]}
            >
              {feedbackMessage}
            </Animated.Text>

            {/* Explanation */}
            {feedbackExplanation ? (
              <Animated.Text
                entering={FadeInUp.delay(200)}
                style={styles.feedbackExplanation}
              >
                {feedbackExplanation}
              </Animated.Text>
            ) : null}

            {/* Streak badge */}
            {showStreakBadge && streak >= 3 && (
              <Animated.View entering={FadeInDown.delay(250)} style={styles.streakBadge}>
                <StreakFire streak={streak} size="small" showCount={false} />
                <Text style={styles.streakBadgeText}>{streak} d'affilée !</Text>
              </Animated.View>
            )}

            {/* Retry phase indicator */}
            {isRetryPhase && lastAnswerCorrect === null && (
              <Animated.View entering={FadeIn.delay(200)} style={styles.retryIndicator}>
                <Icon name="refresh" size={18} color="#FFD700" />
                <Text style={styles.retryText}>Correction des erreurs</Text>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Footer with Continue button and progress */}
        <View style={styles.feedbackFooter}>
          <View style={styles.feedbackProgressRow}>
            <ProgressBar progress={progressPercent} variant="neon" height={4} />
            {erroredSteps.size > 0 && (
              <Text style={styles.errorCount}>
                {erroredSteps.size} erreur{erroredSteps.size > 1 ? 's' : ''} à corriger
              </Text>
            )}
          </View>
          <Pressable
            style={[styles.feedbackContinueButton, { backgroundColor: feedbackColor }]}
            onPress={() => advanceToNextStep()}
          >
            <Text style={styles.feedbackContinueText}>Continuer</Text>
            <Icon name="arrow-right" size={18} color="#0D1117" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Completed state
  if (screenState === 'completed' && lesson) {
    return (
      <SafeAreaView style={styles.container}>
        {showConfetti && <Confetti count={80} onComplete={() => setShowConfetti(false)} />}
        <LevelUpCelebration level={newLevel} visible={showLevelUp} onDismiss={() => setShowLevelUp(false)} />

        <View style={styles.completedContent}>
          <Animated.View entering={FadeIn.duration(400)}>
            <MindyMessage
              message={
                erroredSteps.size === 0
                  ? "Perfect run. Zéro erreur. Tu m'impressionnes. 🔥"
                  : erroredSteps.size <= 2
                  ? "Bien joué, quelques ratés mais tu t'es corrigé. Ça compte."
                  : "On va dire que tu avais faim. Reviens une fois reposé. 😅"
              }
              mood={erroredSteps.size === 0 ? 'hype' : erroredSteps.size <= 2 ? 'neutral' : 'roast'}
            />
          </Animated.View>

          <Animated.View style={styles.completedCard} entering={FadeInUp.delay(300)}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
            )}
            <LinearGradient
              colors={isPracticeMode
                ? ['rgba(88, 166, 255, 0.12)', 'rgba(22, 27, 34, 0.95)']
                : ['rgba(57, 255, 20, 0.12)', 'rgba(22, 27, 34, 0.95)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.completedBorder, isPracticeMode && { borderColor: '#58A6FF' }]} />

            {isPracticeMode && (
              <Animated.View entering={FadeIn.delay(200)} style={styles.practiceBadge}>
                <Text style={styles.practiceBadgeText}>🔄 PRACTICE MODE</Text>
              </Animated.View>
            )}

            <Animated.View entering={BounceIn.delay(400)} style={styles.completedIconContainer}>
              <Icon name="trophy" size={52} color={isPracticeMode ? '#58A6FF' : '#FFD700'} />
            </Animated.View>

            <Animated.Text entering={FadeInUp.delay(500)} style={styles.completedTitle}>
              {isPracticeMode ? 'Pratique Terminée !' : 'Leçon Terminée !'}
            </Animated.Text>
            <Text style={styles.completedLesson}>{lesson.title}</Text>

            {isPracticeMode ? (
              <Animated.View entering={FadeInUp.delay(600)} style={styles.practiceCompleteMsg}>
                <Text style={styles.practiceCompleteMsgText}>
                  Tu maîtrises ce sujet. Aucun XP en mode pratique.
                </Text>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInUp.delay(600)} style={styles.xpReward}>
                <XpCounter value={xpAwarded || lesson.xpReward} showPlus size="large" />
              </Animated.View>
            )}

            {/* Combo Bonus Banner — shows when chaining lessons */}
            {!isPracticeMode && comboCount >= 3 && (
              <Animated.View entering={FadeInUp.delay(650)}>
                <ComboBanner
                  comboCount={comboCount}
                  comboMultiplier={comboMultiplier}
                  bonusXp={bonusXp}
                  visible={comboCount >= 3}
                />
              </Animated.View>
            )}

            {/* Stats */}
            <Animated.View entering={FadeInUp.delay(700)} style={styles.completionStats}>
              {(() => {
                const accuracy = totalSteps > 0
                  ? Math.round(((totalSteps - erroredSteps.size) / totalSteps) * 100)
                  : 100;
                const accuracyColor = accuracy >= 80 ? '#39FF14' : accuracy >= 50 ? '#FFD700' : '#F85149';
                const perfect = erroredSteps.size === 0;
                return (
                  <>
                    <View style={styles.statItem}>
                      <Icon name="target" size={16} color={accuracyColor} />
                      <Text style={[styles.statText, { color: accuracyColor, fontWeight: '700' }]}>
                        {accuracy}% précision
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Icon name="check" size={16} color="#39FF14" />
                      <Text style={styles.statText}>{totalSteps - erroredSteps.size}/{totalSteps} corrects</Text>
                    </View>
                    {streak > 0 && (
                      <View style={styles.statItem}>
                        <Icon name="flame" size={16} color="#FF6B35" />
                        <Text style={styles.statText}>{streak} streak max</Text>
                      </View>
                    )}
                    {perfect && (
                      <View style={[styles.statItem, { backgroundColor: 'rgba(57,255,20,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }]}>
                        <Icon name="sparkles" size={14} color="#FFD700" />
                        <Text style={[styles.statText, { color: '#FFD700', fontWeight: '700' }]}>
                          Perfect run! 🏆
                        </Text>
                      </View>
                    )}
                  </>
                );
              })()}
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(800)} style={styles.footer}>
          <Pressable style={[styles.primaryButton, isPracticeMode && { backgroundColor: '#58A6FF' }]} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>
              {isPracticeMode ? 'Retour aux leçons' : 'Continuer'}
            </Text>
            <Icon name="arrow-right" size={18} color="#0D1117" />
          </Pressable>
          {!isPracticeMode && (
            <>
              <Pressable
                style={styles.challengeButton}
                onPress={() => router.push('/challenges' as any)}
              >
                <Text style={styles.challengeButtonText}>⚔️ Défier un ami sur cette leçon</Text>
              </Pressable>
              <Pressable
                style={styles.practiceAgainButton}
                onPress={() => router.replace(`/lesson/${id}?practice=true`)}
              >
                <Icon name="refresh" size={16} color="#8B949E" />
                <Text style={styles.practiceAgainText}>Pratiquer encore (sans XP)</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Playing state
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow-left" size={20} color="#8B949E" />
        </Pressable>

        <View style={styles.progressContainer}>
          <ProgressBar progress={progressPercent} variant="neon" height={6} />
          <View style={styles.progressInfo}>
            <Text style={styles.stepCounter}>
              {completedInSession.size}/{totalSteps}
            </Text>
            {streak >= 3 && (
              <View style={styles.miniStreak}>
                <Icon name="flame" size={12} color="#FF6B35" />
                <Text style={styles.miniStreakText}>{streak}</Text>
              </View>
            )}
            {erroredSteps.size > 0 && (
              <View style={styles.errorBadge}>
                <Text style={styles.errorBadgeText}>{erroredSteps.size}</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="x" size={20} color="#8B949E" />
        </Pressable>
      </View>

      {/* Retry phase banner */}
      {isRetryPhase && (
        <Animated.View entering={FadeIn} style={styles.retryBanner}>
          <Icon name="refresh" size={16} color="#FFD700" />
          <Text style={styles.retryBannerText}>Correction des erreurs</Text>
        </Animated.View>
      )}

      {/* Step Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          key={stepKey}
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(200)}
        >
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Continue button for info steps */}
      {currentStep?.type === 'info' && (
        <View style={styles.footer}>
          <Pressable style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continuer</Text>
            <Icon name="arrow-right" size={18} color="#0D1117" />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  loadingText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#8B949E',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  headerButton: {
    padding: 8,
    width: 44,
    alignItems: 'center',
  },
  headerSpacer: {
    flex: 1,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 12,
    gap: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stepCounter: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#8B949E',
  },
  miniStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniStreakText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: '700',
  },
  errorBadge: {
    backgroundColor: '#F85149',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  errorBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  retryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.3)',
  },
  retryBannerText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  readyContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 32,
  },
  lessonInfo: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#30363D',
    gap: 16,
  },
  lessonTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#0D1117',
  },
  metaText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    color: '#8B949E',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  footer: {
    padding: 24,
    paddingBottom: 16,
  },
  startButton: {
    backgroundColor: '#39FF14',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  continueButton: {
    backgroundColor: '#39FF14',
    paddingVertical: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  errorButton: {
    backgroundColor: '#30363D',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  errorButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  androidBlur: {
    backgroundColor: 'rgba(22, 27, 34, 0.98)',
  },
  // Feedback screen
  feedbackScrollView: {
    flex: 1,
  },
  feedbackScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  feedbackCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  feedbackBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  feedbackIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackText: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  feedbackExplanation: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#C9D1D9',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  feedbackFooter: {
    padding: 20,
    paddingBottom: 16,
    gap: 16,
  },
  feedbackProgressRow: {
    gap: 8,
  },
  feedbackContinueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  feedbackContinueText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  streakBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B35',
  },
  retryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  retryText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#FFD700',
  },
  errorCount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#F85149',
    textAlign: 'center',
  },
  // Completed screen
  completedContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 32,
  },
  completedCard: {
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  completedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  completedIconContainer: {
    marginBottom: 12,
  },
  completedTitle: {
    fontFamily: 'Inter',
    fontSize: 26,
    fontWeight: '700',
    color: '#39FF14',
  },
  completedLesson: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#8B949E',
    textAlign: 'center',
  },
  xpReward: {
    marginTop: 20,
    alignItems: 'center',
    gap: 4,
  },
  practiceModeBanner: {
    backgroundColor: 'rgba(88, 166, 255, 0.12)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 166, 255, 0.3)',
  },
  practiceModeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#58A6FF',
    textAlign: 'center',
  },
  practiceBadge: {
    backgroundColor: 'rgba(88, 166, 255, 0.15)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignSelf: 'center',
  },
  practiceBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    color: '#58A6FF',
    fontWeight: '700',
  },
  practiceCompleteMsg: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  practiceCompleteMsgText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },
  completionStats: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    color: '#8B949E',
  },
  primaryButton: {
    backgroundColor: '#39FF14',
    paddingVertical: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  practiceAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: 'transparent',
    marginTop: 10,
  },
  practiceAgainText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
  },
  challengeButton: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#39FF14',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(57,255,20,0.05)',
  },
  challengeButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#39FF14',
  },
});
