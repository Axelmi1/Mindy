import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/hooks/useUser';
import { Icon, IconName } from '@/components/ui/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type OnboardingStep =
  | 'welcome'
  | 'domain'
  | 'goal'
  | 'time'
  | 'demo_intro'
  | 'demo_q1'
  | 'demo_q2'
  | 'demo_q3'
  | 'results'
  | 'signup';

interface UserChoices {
  domain: 'CRYPTO' | 'FINANCE' | 'BOTH' | null;
  goal: string | null;
  dailyTime: number | null;
  demoScore: number;
}

const GOALS: { id: string; label: string; icon: IconName }[] = [
  { id: 'invest', label: 'Start investing', icon: 'trending-up' },
  { id: 'understand', label: 'Understand the basics', icon: 'brain' },
  { id: 'career', label: 'Career growth', icon: 'rocket' },
  { id: 'curiosity', label: 'Just curious', icon: 'search' },
];

const TIME_OPTIONS = [
  { minutes: 5, label: '5 min/day', sublabel: 'Casual' },
  { minutes: 10, label: '10 min/day', sublabel: 'Regular' },
  { minutes: 15, label: '15 min/day', sublabel: 'Serious' },
];

// Demo questions (very easy to build confidence)
const DEMO_QUESTIONS = [
  {
    type: 'image_choice',
    question: 'Which one is Bitcoin?',
    options: [
      { id: 'btc', label: '₿', isCorrect: true },
      { id: 'eth', label: 'Ξ', isCorrect: false },
      { id: 'dollar', label: '$', isCorrect: false },
    ],
  },
  {
    type: 'true_false',
    question: '"HODL" means to hold your crypto long-term',
    correctAnswer: true,
  },
  {
    type: 'choice',
    question: 'What happens when you "buy the dip"?',
    options: [
      { id: 'a', label: 'Buy when price drops', isCorrect: true },
      { id: 'b', label: 'Sell everything', isCorrect: false },
      { id: 'c', label: 'Buy a snack', isCorrect: false },
    ],
  },
];

export default function OnboardingScreen() {
  const { initUser } = useUser();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [choices, setChoices] = useState<UserChoices>({
    domain: null,
    goal: null,
    dailyTime: null,
    demoScore: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const progress = useSharedValue(0);

  const getProgressValue = useCallback((currentStep: OnboardingStep) => {
    const steps: OnboardingStep[] = [
      'welcome', 'domain', 'goal', 'time',
      'demo_intro', 'demo_q1', 'demo_q2', 'demo_q3',
      'results', 'signup'
    ];
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
  }, []);

  const goToStep = useCallback((nextStep: OnboardingStep) => {
    progress.value = withTiming(getProgressValue(nextStep), { duration: 300 });
    setStep(nextStep);
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [getProgressValue]);

  const handleDemoAnswer = useCallback(async (answer: string | boolean, correct: boolean) => {
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setChoices(prev => ({ ...prev, demoScore: prev.demoScore + 1 }));
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Auto-advance after feedback
    setTimeout(() => {
      if (step === 'demo_q1') goToStep('demo_q2');
      else if (step === 'demo_q2') goToStep('demo_q3');
      else if (step === 'demo_q3') goToStep('results');
    }, 1200);
  }, [step, goToStep]);

  const handleFinish = useCallback(async () => {
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await initUser();
      // TODO: Save user choices to backend
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error creating user:', err);
      setIsLoading(false);
    }
  }, [initUser]);

  const handleSkipToLogin = useCallback(() => {
    router.replace('/login');
  }, []);

  // Progress bar component
  const renderProgressBar = () => {
    if (step === 'welcome') return null;

    return (
      <Animated.View entering={FadeIn} style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${getProgressValue(step)}%` }
            ]}
          />
        </View>
      </Animated.View>
    );
  };

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.welcomeLogo}>
            <View style={styles.logoBox}>
              <Icon name="brain" size={48} color="#39FF14" />
            </View>
            <Text style={styles.logoText}>MINDY</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)} style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Learn to speak money</Text>
            <Text style={styles.welcomeSubtitle}>
              Master crypto & finance in just 5 minutes a day
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500)} style={styles.welcomeStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2M+</Text>
              <Text style={styles.statLabel}>Learners</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(700)} style={styles.footer}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => goToStep('domain')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>

          <Pressable style={styles.textButton} onPress={handleSkipToLogin}>
            <Text style={styles.textButtonText}>I already have an account</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Domain Selection
  if (step === 'domain') {
    return (
      <SafeAreaView style={styles.container}>
        {renderProgressBar()}

        <Animated.View
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(200)}
          style={styles.content}
        >
          <Text style={styles.stepTitle}>What do you want to learn?</Text>
          <Text style={styles.stepSubtitle}>You can always explore both later</Text>

          <View style={styles.optionsGrid}>
            <Pressable
              style={[
                styles.domainCard,
                choices.domain === 'CRYPTO' && styles.domainCardSelected,
              ]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setChoices(prev => ({ ...prev, domain: 'CRYPTO' }));
              }}
            >
              <Text style={styles.domainIcon}>₿</Text>
              <Text style={styles.domainTitle}>Crypto</Text>
              <Text style={styles.domainDesc}>Bitcoin, trading, DeFi</Text>
            </Pressable>

            <Pressable
              style={[
                styles.domainCard,
                styles.domainCardFinance,
                choices.domain === 'FINANCE' && styles.domainCardSelectedFinance,
              ]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setChoices(prev => ({ ...prev, domain: 'FINANCE' }));
              }}
            >
              <Text style={styles.domainIcon}>$</Text>
              <Text style={styles.domainTitle}>Finance</Text>
              <Text style={styles.domainDesc}>Investing, budgeting, stocks</Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.bothButton,
              choices.domain === 'BOTH' && styles.bothButtonSelected,
            ]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setChoices(prev => ({ ...prev, domain: 'BOTH' }));
            }}
          >
            <View style={styles.bothButtonContent}>
              {choices.domain === 'BOTH' && <Icon name="check" size={18} color="#FFD700" />}
              <Text style={styles.bothButtonText}>Both!</Text>
            </View>
          </Pressable>
        </Animated.View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, !choices.domain && styles.buttonDisabled]}
            onPress={() => choices.domain && goToStep('goal')}
            disabled={!choices.domain}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Goal Selection
  if (step === 'goal') {
    return (
      <SafeAreaView style={styles.container}>
        {renderProgressBar()}

        <Animated.View
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(200)}
          style={styles.content}
        >
          <Text style={styles.stepTitle}>Why do you want to learn?</Text>
          <Text style={styles.stepSubtitle}>This helps us personalize your experience</Text>

          <View style={styles.goalsList}>
            {GOALS.map((goal) => (
              <Pressable
                key={goal.id}
                style={[
                  styles.goalItem,
                  choices.goal === goal.id && styles.goalItemSelected,
                ]}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setChoices(prev => ({ ...prev, goal: goal.id }));
                }}
              >
                <View style={styles.goalIconContainer}>
                  <Icon name={goal.icon} size={24} color="#E6EDF3" />
                </View>
                <Text style={styles.goalLabel}>{goal.label}</Text>
                {choices.goal === goal.id && (
                  <Icon name="check" size={18} color="#39FF14" />
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, !choices.goal && styles.buttonDisabled]}
            onPress={() => choices.goal && goToStep('time')}
            disabled={!choices.goal}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Time Commitment
  if (step === 'time') {
    return (
      <SafeAreaView style={styles.container}>
        {renderProgressBar()}

        <Animated.View
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(200)}
          style={styles.content}
        >
          <Text style={styles.stepTitle}>Set a daily goal</Text>
          <Text style={styles.stepSubtitle}>
            Consistency beats intensity. Pick what works for you.
          </Text>

          <View style={styles.timeOptions}>
            {TIME_OPTIONS.map((option) => (
              <Pressable
                key={option.minutes}
                style={[
                  styles.timeCard,
                  choices.dailyTime === option.minutes && styles.timeCardSelected,
                ]}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setChoices(prev => ({ ...prev, dailyTime: option.minutes }));
                }}
              >
                <Text style={styles.timeMinutes}>{option.minutes}</Text>
                <Text style={styles.timeLabel}>min/day</Text>
                <Text style={styles.timeSublabel}>{option.sublabel}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.commitmentNote}>
            <Icon name="lightbulb" size={18} color="#FFD700" />
            <Text style={styles.commitmentText}>
              Most successful learners start with 5 minutes
            </Text>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, !choices.dailyTime && styles.buttonDisabled]}
            onPress={() => choices.dailyTime && goToStep('demo_intro')}
            disabled={!choices.dailyTime}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Demo Intro
  if (step === 'demo_intro') {
    return (
      <SafeAreaView style={styles.container}>
        {renderProgressBar()}

        <Animated.View
          entering={SlideInRight.duration(300)}
          style={styles.content}
        >
          <View style={styles.demoIntroIcon}>
            <Icon name="play" size={64} color="#39FF14" />
          </View>

          <Text style={styles.stepTitle}>Let's try a quick lesson!</Text>
          <Text style={styles.stepSubtitle}>
            3 easy questions to see how MINDY works.{'\n'}No pressure, just have fun!
          </Text>

          <View style={styles.demoPreview}>
            <View style={styles.demoPreviewItem}>
              <Icon name="check" size={16} color="#39FF14" />
              <Text style={styles.demoPreviewText}>Takes 30 seconds</Text>
            </View>
            <View style={styles.demoPreviewItem}>
              <Icon name="check" size={16} color="#39FF14" />
              <Text style={styles.demoPreviewText}>Learn real concepts</Text>
            </View>
            <View style={styles.demoPreviewItem}>
              <Icon name="check" size={16} color="#39FF14" />
              <Text style={styles.demoPreviewText}>Earn your first XP</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => goToStep('demo_q1')}
          >
            <Text style={styles.primaryButtonText}>Let's Go!</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Demo Question 1 (Image choice)
  if (step === 'demo_q1') {
    const q = DEMO_QUESTIONS[0];
    return (
      <SafeAreaView style={styles.container}>
        {renderProgressBar()}

        <Animated.View
          entering={SlideInRight.duration(300)}
          style={styles.content}
        >
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>1/3</Text>
          </View>

          <Text style={styles.questionText}>{q.question}</Text>

          <View style={styles.imageOptions}>
            {q.options?.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.imageOption,
                  selectedAnswer === option.id && (option.isCorrect ? styles.optionCorrect : styles.optionWrong),
                  showFeedback && option.isCorrect && styles.optionCorrect,
                ]}
                onPress={() => !showFeedback && handleDemoAnswer(option.id, option.isCorrect)}
                disabled={showFeedback}
              >
                <Text style={styles.imageOptionText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>

          {showFeedback && (
            <Animated.View entering={FadeIn} style={styles.feedback}>
              <View style={styles.feedbackHeader}>
                <Icon name={isCorrect ? 'check' : 'x'} size={24} color={isCorrect ? '#39FF14' : '#F85149'} />
                <Text style={[styles.feedbackText, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
                  {isCorrect ? 'Correct!' : 'Not quite!'}
                </Text>
              </View>
              <Text style={styles.feedbackExplanation}>
                ₿ is the symbol for Bitcoin
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Demo Question 2 (True/False)
  if (step === 'demo_q2') {
    const q = DEMO_QUESTIONS[1];
    return (
      <SafeAreaView style={styles.container}>
        {renderProgressBar()}

        <Animated.View
          entering={SlideInRight.duration(300)}
          style={styles.content}
        >
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>2/3</Text>
          </View>

          <Text style={styles.questionText}>{q.question}</Text>

          <View style={styles.trueFalseOptions}>
            <Pressable
              style={[
                styles.trueFalseButton,
                styles.trueButton,
                selectedAnswer === true && (q.correctAnswer ? styles.optionCorrect : styles.optionWrong),
                showFeedback && q.correctAnswer && styles.optionCorrect,
              ]}
              onPress={() => !showFeedback && handleDemoAnswer(true, q.correctAnswer === true)}
              disabled={showFeedback}
            >
              <Text style={styles.trueFalseText}>TRUE</Text>
            </Pressable>

            <Pressable
              style={[
                styles.trueFalseButton,
                styles.falseButton,
                selectedAnswer === false && (!q.correctAnswer ? styles.optionCorrect : styles.optionWrong),
                showFeedback && !q.correctAnswer && styles.optionCorrect,
              ]}
              onPress={() => !showFeedback && handleDemoAnswer(false, q.correctAnswer === false)}
              disabled={showFeedback}
            >
              <Text style={styles.trueFalseText}>FALSE</Text>
            </Pressable>
          </View>

          {showFeedback && (
            <Animated.View entering={FadeIn} style={styles.feedback}>
              <View style={styles.feedbackHeader}>
                <Icon name={isCorrect ? 'check' : 'x'} size={24} color={isCorrect ? '#39FF14' : '#F85149'} />
                <Text style={[styles.feedbackText, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
                  {isCorrect ? 'Correct!' : 'Not quite!'}
                </Text>
              </View>
              <Text style={styles.feedbackExplanation}>
                HODL originated from a typo of "HOLD" and became crypto slang
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Demo Question 3 (Multiple choice)
  if (step === 'demo_q3') {
    const q = DEMO_QUESTIONS[2];
    return (
      <SafeAreaView style={styles.container}>
        {renderProgressBar()}

        <Animated.View
          entering={SlideInRight.duration(300)}
          style={styles.content}
        >
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>3/3</Text>
          </View>

          <Text style={styles.questionText}>{q.question}</Text>

          <View style={styles.choiceOptions}>
            {q.options?.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.choiceOption,
                  selectedAnswer === option.id && (option.isCorrect ? styles.optionCorrect : styles.optionWrong),
                  showFeedback && option.isCorrect && styles.optionCorrect,
                ]}
                onPress={() => !showFeedback && handleDemoAnswer(option.id, option.isCorrect)}
                disabled={showFeedback}
              >
                <Text style={styles.choiceText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>

          {showFeedback && (
            <Animated.View entering={FadeIn} style={styles.feedback}>
              <View style={styles.feedbackHeader}>
                <Icon name={isCorrect ? 'check' : 'x'} size={24} color={isCorrect ? '#39FF14' : '#F85149'} />
                <Text style={[styles.feedbackText, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
                  {isCorrect ? 'Correct!' : 'Not quite!'}
                </Text>
              </View>
              <Text style={styles.feedbackExplanation}>
                "Buy the dip" means purchasing when prices drop
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Results Screen
  if (step === 'results') {
    const percentage = Math.round((choices.demoScore / 3) * 100);

    return (
      <SafeAreaView style={styles.container}>
        {renderProgressBar()}

        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.content}
        >
          <View style={styles.resultsCard}>
            <View style={styles.resultsIconContainer}>
              <Icon
                name={percentage >= 66 ? 'trophy' : percentage >= 33 ? 'thumbs-up' : 'zap'}
                size={64}
                color={percentage >= 66 ? '#FFD700' : '#39FF14'}
              />
            </View>
            <Text style={styles.resultsTitle}>
              {percentage >= 66 ? 'Amazing!' : percentage >= 33 ? 'Good job!' : 'Nice try!'}
            </Text>
            <Text style={styles.resultsScore}>{choices.demoScore}/3 correct</Text>

            <View style={styles.xpEarned}>
              <Text style={styles.xpAmount}>+{choices.demoScore * 10} XP</Text>
              <Text style={styles.xpLabel}>earned</Text>
            </View>
          </View>

          <View style={styles.resultsInsight}>
            <Text style={styles.insightText}>
              You're already learning! Imagine what you'll know after a week of daily practice.
            </Text>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => goToStep('signup')}
          >
            <Text style={styles.primaryButtonText}>Save My Progress</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Signup/Save Progress Screen
  if (step === 'signup') {
    return (
      <SafeAreaView style={styles.container}>
        {renderProgressBar()}

        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.content}
        >
          <View style={styles.signupHeader}>
            <View style={styles.signupIconContainer}>
              <Icon name="sparkles" size={64} color="#FFD700" />
            </View>
            <Text style={styles.signupTitle}>You're all set!</Text>
            <Text style={styles.signupSubtitle}>
              Create an account to save your progress and continue learning
            </Text>
          </View>

          <View style={styles.signupBenefits}>
            <View style={styles.benefitItem}>
              <Icon name="save" size={20} color="#39FF14" />
              <Text style={styles.benefitText}>Save your progress</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="flame" size={20} color="#FF6B35" />
              <Text style={styles.benefitText}>Track your streak</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="trophy" size={20} color="#FFD700" />
              <Text style={styles.benefitText}>Earn achievements</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Pressable
            style={styles.primaryButton}
            onPress={handleFinish}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0D1117" />
            ) : (
              <Text style={styles.primaryButtonText}>Start Learning</Text>
            )}
          </Pressable>

          <Pressable style={styles.textButton} onPress={handleSkipToLogin}>
            <Text style={styles.textButtonText}>I have an account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#30363D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#39FF14',
    borderRadius: 3,
  },

  // Welcome Screen
  welcomeLogo: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#161B22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#39FF14',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 48,
  },
  logoText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 32,
    fontWeight: '700',
    color: '#39FF14',
    letterSpacing: 4,
  },
  welcomeContent: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeTitle: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    color: '#E6EDF3',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
  },
  welcomeStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontFamily: 'JetBrainsMono',
    fontSize: 24,
    fontWeight: '700',
    color: '#39FF14',
  },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#30363D',
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#39FF14',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
  buttonDisabled: {
    backgroundColor: '#30363D',
  },
  textButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  textButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
  },

  // Step screens
  stepTitle: {
    fontFamily: 'Inter',
    fontSize: 26,
    fontWeight: '700',
    color: '#E6EDF3',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },

  // Domain selection
  optionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  domainCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#30363D',
  },
  domainCardFinance: {
    borderColor: '#30363D',
  },
  domainCardSelected: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
  },
  domainCardSelectedFinance: {
    borderColor: '#58A6FF',
    backgroundColor: 'rgba(88, 166, 255, 0.1)',
  },
  domainIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  domainTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 4,
  },
  domainDesc: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
  bothButton: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#30363D',
  },
  bothButtonSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  bothButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  bothButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Goals
  goalsList: {
    gap: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#30363D',
  },
  goalItemSelected: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
  },
  goalIconContainer: {
    marginRight: 16,
  },
  goalLabel: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#E6EDF3',
  },
  goalCheck: {
    fontSize: 18,
    color: '#39FF14',
  },

  // Time
  timeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#30363D',
  },
  timeCardSelected: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
  },
  timeMinutes: {
    fontFamily: 'JetBrainsMono',
    fontSize: 32,
    fontWeight: '700',
    color: '#39FF14',
  },
  timeLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
  },
  timeSublabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#484F58',
    marginTop: 8,
  },
  commitmentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  commitmentIcon: {
    fontSize: 16,
  },
  commitmentText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
  },

  // Demo intro
  demoIntroIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  demoIntroEmoji: {
    fontSize: 64,
  },
  demoPreview: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  demoPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  demoPreviewIcon: {
    fontSize: 16,
    color: '#39FF14',
  },
  demoPreviewText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#E6EDF3',
  },

  // Questions
  questionHeader: {
    marginBottom: 32,
  },
  questionNumber: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
  },
  questionText: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '600',
    color: '#E6EDF3',
    textAlign: 'center',
    marginBottom: 32,
  },
  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  imageOption: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#161B22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#30363D',
  },
  imageOptionText: {
    fontSize: 36,
  },
  trueFalseOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  trueFalseButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  trueButton: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: '#39FF14',
  },
  falseButton: {
    backgroundColor: 'rgba(248, 81, 73, 0.1)',
    borderColor: '#F85149',
  },
  trueFalseText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  choiceOptions: {
    gap: 12,
  },
  choiceOption: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: '#30363D',
  },
  choiceText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#E6EDF3',
    textAlign: 'center',
  },
  optionCorrect: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
  },
  optionWrong: {
    borderColor: '#F85149',
    backgroundColor: 'rgba(248, 81, 73, 0.2)',
  },
  feedback: {
    marginTop: 24,
    alignItems: 'center',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  feedbackText: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
  },
  feedbackCorrect: {
    color: '#39FF14',
  },
  feedbackWrong: {
    color: '#F85149',
  },
  feedbackExplanation: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
  },

  // Results
  resultsCard: {
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#39FF14',
    marginBottom: 24,
  },
  resultsIconContainer: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 8,
  },
  resultsScore: {
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    color: '#8B949E',
    marginBottom: 24,
  },
  xpEarned: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  xpAmount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD700',
  },
  xpLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
  },
  resultsInsight: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
  },
  insightText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Signup
  signupHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  signupIconContainer: {
    marginBottom: 16,
  },
  signupTitle: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 8,
  },
  signupSubtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 22,
  },
  signupBenefits: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    fontSize: 20,
  },
  benefitText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#E6EDF3',
  },
});
