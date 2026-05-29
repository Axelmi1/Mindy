import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MindyTurn } from '../components/MindyTurn';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { selectDemoQuestions } from '../data/selectDemoQuestions';

export function DemoQuestionStep() {
  const domain = useOnboardingStore((s) => s.domain);
  const level = useOnboardingStore((s) => s.level);
  const next = useOnboardingStore((s) => s.next);
  const recordDemoAnswer = useOnboardingStore((s) => s.recordDemoAnswer);
  const setMood = useOnboardingStore((s) => s.setMood);

  const [questions] = useState(() => selectDemoQuestions(domain, level));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const q = questions[index];

  useEffect(() => { setMood('neutral'); }, [setMood, index]);

  const answer = async (optionId: string, isCorrect: boolean) => {
    if (picked) return; // déjà répondu
    setPicked(optionId);
    setCorrect(isCorrect);
    recordDemoAnswer(q.id, isCorrect);
    setMood(isCorrect ? 'hype' : 'roast');
    await Haptics.notificationAsync(
      isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    );
  };

  const proceed = () => {
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setPicked(null);
      setCorrect(null);
    } else {
      next(); // → result
    }
  };

  const message = picked
    ? (correct ? `Exact ! ${q.explanation}` : `Pas tout à fait. ${q.explanation}`)
    : `Question ${index + 1}/3 — ${q.question}`;

  return (
    <MindyTurn
      turnKey={`demo-${index}`}
      mood={picked ? (correct ? 'hype' : 'roast') : 'neutral'}
      message={message}
      ctaLabel={picked ? (index < questions.length - 1 ? 'Suivant' : 'Voir mon score') : undefined}
      onCta={proceed}
    >
      <View style={styles.options}>
        {q.type === 'true_false' ? (
          <>
            <Choice label="VRAI" active={picked === 'true'} good={picked != null && q.correctAnswer === true}
              bad={picked === 'true' && q.correctAnswer !== true}
              onPress={() => answer('true', q.correctAnswer === true)} />
            <Choice label="FAUX" active={picked === 'false'} good={picked != null && q.correctAnswer === false}
              bad={picked === 'false' && q.correctAnswer !== false}
              onPress={() => answer('false', q.correctAnswer === false)} />
          </>
        ) : (
          q.options.map((o) => (
            <Choice
              key={o.id}
              label={o.label}
              big={q.type === 'image_choice'}
              active={picked === o.id}
              good={picked != null && o.isCorrect}
              bad={picked === o.id && !o.isCorrect}
              onPress={() => answer(o.id, o.isCorrect)}
            />
          ))
        )}
      </View>
    </MindyTurn>
  );
}

function Choice({ label, onPress, active, good, bad, big }: {
  label: string; onPress: () => void; active?: boolean; good?: boolean; bad?: boolean; big?: boolean;
}) {
  let style = styles.choice;
  if (good) style = styles.choiceGood;
  else if (bad) style = styles.choiceBad;
  else if (active) style = styles.choiceActive;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={style}>
      <Text style={big ? styles.choiceTextBig : styles.choiceText}>{label}</Text>
    </TouchableOpacity>
  );
}

const base = {
  padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#30363D',
  backgroundColor: '#161B22', alignItems: 'center' as const,
};
const styles = StyleSheet.create({
  options: { gap: 12 },
  choice: base,
  choiceActive: { ...base, borderColor: '#58A6FF' },
  choiceGood: { ...base, borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.12)' },
  choiceBad: { ...base, borderColor: '#F85149', backgroundColor: 'rgba(248,81,73,0.12)' },
  choiceText: { fontFamily: 'Inter', fontSize: 16, color: '#E6EDF3', fontWeight: '600' },
  choiceTextBig: { fontFamily: 'Inter', fontSize: 32 },
});
