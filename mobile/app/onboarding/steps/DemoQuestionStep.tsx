import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { MindyMascot } from '@/components/mindy';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { useOnboardingStore, StepId } from '../hooks/useOnboardingStore';
import { useDemoQuestions } from '../hooks/useDemoQuestions';

interface Props {
  questionIndex: 0 | 1 | 2;
  stepKey: Extract<StepId, 'demo_q1' | 'demo_q2' | 'demo_q3'>;
}

export function DemoQuestionStep({ questionIndex, stepKey }: Props) {
  const domain = useOnboardingStore((s) => s.domain);
  const next = useOnboardingStore((s) => s.next);
  const record = useOnboardingStore((s) => s.recordDemoAnswer);
  const questions = useDemoQuestions(domain);
  const question = questions[questionIndex];

  const [selected, setSelected] = useState<string | boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setSelected(null);
    setShowFeedback(false);
    setIsCorrect(false);
  }, [stepKey]);

  const answer = useCallback(async (value: string | boolean, correct: boolean) => {
    setSelected(value);
    setIsCorrect(correct);
    setShowFeedback(true);
    record(question.id, correct);
    await Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    setTimeout(() => next(), 1500);
  }, [question.id, next, record]);

  return (
    <OnboardingScreen animationKey={stepKey}>
      <View style={styles.header}>
        <Text style={styles.num}>{questionIndex + 1}/3</Text>
      </View>

      <Text style={styles.question}>{question.question}</Text>

      {question.type === 'image_choice' && (
        <View style={styles.imageOpts}>
          {question.options.map((o) => (
            <Pressable
              key={o.id}
              disabled={showFeedback}
              style={[
                styles.imageOpt,
                selected === o.id && (o.isCorrect ? styles.correct : styles.wrong),
                showFeedback && o.isCorrect && styles.correct,
              ]}
              onPress={() => answer(o.id, o.isCorrect)}
            >
              <Text style={styles.imageOptText}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {question.type === 'true_false' && (
        <View style={styles.tfOpts}>
          <Pressable
            disabled={showFeedback}
            style={[
              styles.tf, styles.tfTrue,
              selected === true && (question.correctAnswer ? styles.correct : styles.wrong),
              showFeedback && question.correctAnswer && styles.correct,
            ]}
            onPress={() => answer(true, question.correctAnswer === true)}
          >
            <Text style={styles.tfText}>TRUE</Text>
          </Pressable>
          <Pressable
            disabled={showFeedback}
            style={[
              styles.tf, styles.tfFalse,
              selected === false && (!question.correctAnswer ? styles.correct : styles.wrong),
              showFeedback && !question.correctAnswer && styles.correct,
            ]}
            onPress={() => answer(false, question.correctAnswer === false)}
          >
            <Text style={styles.tfText}>FALSE</Text>
          </Pressable>
        </View>
      )}

      {question.type === 'choice' && (
        <View style={styles.choiceOpts}>
          {question.options.map((o) => (
            <Pressable
              key={o.id}
              disabled={showFeedback}
              style={[
                styles.choice,
                selected === o.id && (o.isCorrect ? styles.correct : styles.wrong),
                showFeedback && o.isCorrect && styles.correct,
              ]}
              onPress={() => answer(o.id, o.isCorrect)}
            >
              <Text style={styles.choiceText}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {showFeedback && (
        <Animated.View entering={FadeIn} style={styles.feedback}>
          <MindyMascot mood={isCorrect ? 'hype' : 'roast'} size={60} animated={false} />
          <View style={{ flex: 1 }}>
            <View style={styles.feedbackHeader}>
              <Icon name={isCorrect ? 'check' : 'x'} size={20} color={isCorrect ? '#39FF14' : '#F85149'} />
              <Text style={[styles.feedbackTitle, { color: isCorrect ? '#39FF14' : '#F85149' }]}>
                {isCorrect ? 'Correct!' : 'Not quite!'}
              </Text>
            </View>
            <Text style={styles.feedbackText}>{question.explanation}</Text>
          </View>
        </Animated.View>
      )}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 32 },
  num: { fontFamily: 'JetBrainsMono', fontSize: 14, color: '#8B949E', textAlign: 'center' },
  question: { fontFamily: 'Inter', fontSize: 22, fontWeight: '600', color: '#E6EDF3', textAlign: 'center', marginBottom: 32 },
  imageOpts: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  imageOpt: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#161B22', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#30363D' },
  imageOptText: { fontSize: 36 },
  tfOpts: { flexDirection: 'row', gap: 16 },
  tf: { flex: 1, paddingVertical: 20, borderRadius: 12, alignItems: 'center', borderWidth: 2 },
  tfTrue: { backgroundColor: 'rgba(57,255,20,0.1)', borderColor: '#39FF14' },
  tfFalse: { backgroundColor: 'rgba(248,81,73,0.1)', borderColor: '#F85149' },
  tfText: { fontFamily: 'JetBrainsMono', fontSize: 16, fontWeight: '700', color: '#E6EDF3' },
  choiceOpts: { gap: 12 },
  choice: { backgroundColor: '#161B22', borderRadius: 12, padding: 18, borderWidth: 2, borderColor: '#30363D' },
  choiceText: { fontFamily: 'Inter', fontSize: 16, color: '#E6EDF3', textAlign: 'center' },
  correct: { borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.2)' },
  wrong: { borderColor: '#F85149', backgroundColor: 'rgba(248,81,73,0.2)' },
  feedback: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 24, backgroundColor: '#161B22', padding: 14, borderRadius: 12 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  feedbackTitle: { fontFamily: 'Inter', fontSize: 16, fontWeight: '700' },
  feedbackText: { fontFamily: 'Inter', fontSize: 13, color: '#8B949E' },
});
