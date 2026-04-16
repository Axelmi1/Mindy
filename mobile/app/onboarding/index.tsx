import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
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
import { useReferrals } from '@/hooks/useReferrals';
import { Icon, IconName } from '@/components/ui/Icon';
import {
  abTestService,
  trackABConversion,
  type OnboardingVariant,
} from '@/services/abtest';

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
  | 'signup'
  | 'invite_friend';

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
  const { initUser, userId } = useUser();
  const { stats: referralStats, shareReferralCode } = useReferrals(userId);
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [choices, setChoices] = useState<UserChoices>({
    domain: null,
    goal: null,
    dailyTime: null,
    demoScore: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [abVariant, setAbVariant] = useState<OnboardingVariant>('control');

  // Assign A/B variant on mount (anonymous user = hash of timestamp)
  useEffect(() => {
    const anonId = `anon_${Date.now().toString(36)}`;
    abTestService.initialize(anonId).then(() =>
      abTestService.getVariant('ONBOARDING_FLOW').then(setAbVariant),
    );
  }, []);
  const [selectedAnswer, setSelectedAnswer] = useState<string | boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const progress = useSharedValue(0);

  const getProgressValue = useCallback((currentStep: OnboardingStep) => {
    const steps: OnboardingStep[] = [
      'welcome', 'domain', 'goal', 'time',
      'demo_intro', 'demo_q1', 'demo_q2', 'demo_q3',
      'results', 'signup', 'invite_friend',
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
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    if (trimmed.length > 20) {
      setUsernameError('Max 20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameError('Only letters, numbers and underscore');
      return;
    }

    setUsernameError('');
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await initUser(trimmed, {
        preferredDomain: choices.domain ?? undefined,
        userGoal: choices.goal ?? undefined,
      });

      // Track A/B test conversion: onboarding completed
      trackABConversion('ONBOARDING_FLOW', 'onboarding_completed');

      // Go to invite_friend step before main app
      goToStep('invite_friend');
    } catch (err) {
      console.error('Error creating user:', err);
      setIsLoading(false);
    }
  }, [initUser, username, abVariant, goToStep]);

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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
            <View style={styles.signupHeader}>
              <View style={styles.signupIconContainer}>
                <Icon name="user" size={48} color="#39FF14" />
              </View>
              <Text style={styles.signupTitle}>Choose your username</Text>
              <Text style={styles.signupSubtitle}>
                This is how you'll appear on the leaderboard
              </Text>
            </View>

            {/* Username input */}
            <View style={styles.usernameInputWrapper}>
              <View style={[
                styles.usernameInputContainer,
                usernameError ? styles.usernameInputError : username.length >= 3 && styles.usernameInputValid,
              ]}>
                <Text style={styles.usernamePrefix}>@</Text>
                <TextInput
                  style={styles.usernameInput}
                  placeholder="satoshi"
                  placeholderTextColor="#484F58"
                  value={username}
                  onChangeText={(t) => {
                    setUsername(t);
                    setUsernameError('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  returnKeyType="done"
                  onSubmitEditing={handleFinish}
                />
                {username.length >= 3 && !usernameError && (
                  <Icon name="check" size={18} color="#39FF14" />
                )}
              </View>
              {usernameError ? (
                <Text style={styles.usernameErrorText}>{usernameError}</Text>
              ) : (
                <Text style={styles.usernameHint}>Letters, numbers, underscore — 3 to 20 chars</Text>
              )}
            </View>

            <View style={styles.signupBenefits}>
              <View style={styles.benefitItem}>
                <Icon name="trophy" size={18} color="#FFD700" />
                <Text style={styles.benefitText}>Appear on the leaderboard</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="flame" size={18} color="#FF6B35" />
                <Text style={styles.benefitText}>Track your streak</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="gift" size={18} color="#58A6FF" />
                <Text style={styles.benefitText}>Share your referral code</Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <Pressable
              style={[styles.primaryButton, (isLoading || username.trim().length < 3) && styles.buttonDisabled]}
              onPress={handleFinish}
              disabled={isLoading || username.trim().length < 3}
            >
              {isLoading ? (
                <ActivityIndicator color="#0D1117" />
              ) : (
                <Text style={styles.primaryButtonText}>Start Learning 🚀</Text>
              )}
            </Pressable>

            <Pressable style={styles.textButton} onPress={handleSkipToLogin}>
              <Text style={styles.textButtonText}>I already have an account</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Invite Friend Screen
  if (step === 'invite_friend') {
    const referralCode = referralStats?.referralCode ?? '…';
    const shareMessage = [
      `🧠 Je viens de rejoindre MINDY — l'app qui t'apprend la crypto & la finance en 5 min/jour !`,
      ``,
      `📱 Rejoins-moi avec mon code de parrainage : ${referralCode}`,
      `👉 mindy://invite/${referralCode}`,
      ``,
      `On apprend ensemble ! 🚀`,
    ].join('\n');

    const handleShareInvite = async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        await Share.share({
          message: shareMessage,
          title: 'Rejoins-moi sur Mindy',
        });
      } catch {
        // User cancelled — silent
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        {renderProgressBar()}

        <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
          {/* Celebration header */}
          <View style={inviteStyles.celebrationBox}>
            <Text style={inviteStyles.emoji}>🎉</Text>
            <Text style={inviteStyles.welcomeTitle}>Tu es prêt !</Text>
            <Text style={inviteStyles.welcomeSub}>
              Bienvenue dans Mindy. Maintenant, invite tes amis et montez ensemble.
            </Text>
          </View>

          {/* Referral code card */}
          <Animated.View entering={FadeInUp.delay(200)} style={inviteStyles.codeCard}>
            <Text style={inviteStyles.codeLabel}>Ton code de parrainage</Text>
            <View style={inviteStyles.codeBox}>
              <Text style={inviteStyles.codeText}>{referralCode}</Text>
            </View>
            <Text style={inviteStyles.codeHint}>
              Chaque ami parrainé te rapporte 50 XP bonus 🎁
            </Text>
          </Animated.View>

          {/* Perks */}
          <Animated.View entering={FadeInUp.delay(350)} style={inviteStyles.perksContainer}>
            <View style={inviteStyles.perkRow}>
              <Text style={inviteStyles.perkIcon}>⚡</Text>
              <Text style={inviteStyles.perkText}>+50 XP pour toi à chaque inscription</Text>
            </View>
            <View style={inviteStyles.perkRow}>
              <Text style={inviteStyles.perkIcon}>🔥</Text>
              <Text style={inviteStyles.perkText}>Défie tes amis sur des leçons</Text>
            </View>
            <View style={inviteStyles.perkRow}>
              <Text style={inviteStyles.perkIcon}>🏆</Text>
              <Text style={inviteStyles.perkText}>Grimpe au classement ensemble</Text>
            </View>
          </Animated.View>
        </Animated.View>

        <View style={styles.footer}>
          {/* Share button */}
          <Pressable style={inviteStyles.shareButton} onPress={handleShareInvite}>
            <Icon name="share" size={18} color="#0D1117" />
            <Text style={inviteStyles.shareButtonText}>Inviter des amis 🚀</Text>
          </Pressable>

          {/* Skip */}
          <Pressable style={styles.textButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.textButtonText}>Passer pour l'instant</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Invite screen styles ─────────────────────────────────────────────────────
const inviteStyles = StyleSheet.create({
  celebrationBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 8,
  },
  welcomeSub: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  codeCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(57,255,20,0.4)',
    gap: 12,
    marginBottom: 20,
    shadowColor: '#39FF14',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  codeLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: '#0D1117',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#39FF14',
  },
  codeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 26,
    fontWeight: '700',
    color: '#39FF14',
    letterSpacing: 3,
  },
  codeHint: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
  perksContainer: {
    backgroundColor: '#161B22',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  perkIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  perkText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#E6EDF3',
    flex: 1,
  },
  shareButton: {
    backgroundColor: '#39FF14',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  shareButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0D1117',
  },
});

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
    marginBottom: 24,
  },
  signupIconContainer: {
    marginBottom: 16,
  },
  signupTitle: {
    fontFamily: 'Inter',
    fontSize: 26,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 8,
    textAlign: 'center',
  },
  signupSubtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },
  usernameInputWrapper: {
    marginBottom: 20,
    gap: 6,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#30363D',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  usernameInputValid: {
    borderColor: '#39FF14',
  },
  usernameInputError: {
    borderColor: '#F85149',
  },
  usernamePrefix: {
    fontFamily: 'JetBrainsMono',
    fontSize: 18,
    color: '#39FF14',
    fontWeight: '700',
  },
  usernameInput: {
    flex: 1,
    fontFamily: 'JetBrainsMono',
    fontSize: 18,
    color: '#E6EDF3',
    padding: 0,
  },
  usernameHint: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#484F58',
    paddingHorizontal: 4,
  },
  usernameErrorText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#F85149',
    paddingHorizontal: 4,
  },
  signupBenefits: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#E6EDF3',
  },
});
