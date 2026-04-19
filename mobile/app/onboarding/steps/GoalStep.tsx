import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon, IconName } from '@/components/ui/Icon';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const GOALS: { id: string; label: string; icon: IconName }[] = [
  { id: 'invest',     label: 'Start investing',        icon: 'trending-up' },
  { id: 'understand', label: 'Understand the basics',  icon: 'brain' },
  { id: 'career',     label: 'Career growth',          icon: 'rocket' },
  { id: 'curiosity',  label: 'Just curious',           icon: 'search' },
];

export function GoalStep() {
  const goal = useOnboardingStore((s) => s.goal);
  const setGoal = useOnboardingStore((s) => s.setGoal);
  const next = useOnboardingStore((s) => s.next);

  const pick = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoal(id);
  };

  return (
    <OnboardingScreen
      animationKey="goal"
      footer={<PrimaryButton onPress={next} disabled={!goal}>Continue</PrimaryButton>}
    >
      <Text style={styles.title}>Why do you want to learn?</Text>
      <Text style={styles.subtitle}>This helps us personalize your experience</Text>

      <View style={styles.list}>
        {GOALS.map((g) => {
          const isSelected = goal === g.id;
          return (
            <Pressable
              key={g.id}
              style={[styles.item, isSelected && styles.selected]}
              onPress={() => pick(g.id)}
            >
              <View style={styles.iconBox}>
                <Icon name={g.icon} size={24} color="#E6EDF3" />
              </View>
              <Text style={styles.label}>{g.label}</Text>
              {isSelected && <Icon name="check" size={18} color="#39FF14" />}
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', marginBottom: 32 },
  list: { gap: 12 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161B22', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#30363D' },
  selected: { borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.1)' },
  iconBox: { marginRight: 16 },
  label: { flex: 1, fontFamily: 'Inter', fontSize: 16, color: '#E6EDF3' },
});
