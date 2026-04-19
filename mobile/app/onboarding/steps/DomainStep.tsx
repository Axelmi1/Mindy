import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore, Domain } from '../hooks/useOnboardingStore';

export function DomainStep() {
  const domain = useOnboardingStore((s) => s.domain);
  const setDomain = useOnboardingStore((s) => s.setDomain);
  const next = useOnboardingStore((s) => s.next);

  const pick = async (d: Domain) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDomain(d);
  };

  return (
    <OnboardingScreen
      animationKey="domain"
      footer={
        <PrimaryButton onPress={next} disabled={!domain}>Continue</PrimaryButton>
      }
    >
      <Text style={styles.title}>What do you want to learn?</Text>
      <Text style={styles.subtitle}>You can always explore both later</Text>

      <View style={styles.cards}>
        <Pressable
          style={[styles.card, domain === 'CRYPTO' && styles.selectedCrypto]}
          onPress={() => pick('CRYPTO')}
        >
          <Text style={styles.bigIcon}>₿</Text>
          <Text style={styles.cardTitle}>Crypto</Text>
          <Text style={styles.cardDesc}>Bitcoin, trading, DeFi</Text>
        </Pressable>
        <Pressable
          style={[styles.card, domain === 'FINANCE' && styles.selectedFinance]}
          onPress={() => pick('FINANCE')}
        >
          <Text style={styles.bigIcon}>$</Text>
          <Text style={styles.cardTitle}>Finance</Text>
          <Text style={styles.cardDesc}>Investing, budgeting, stocks</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.both, domain === 'BOTH' && styles.selectedBoth]}
        onPress={() => pick('BOTH')}
      >
        {domain === 'BOTH' && <Icon name="check" size={18} color="#FFD700" />}
        <Text style={styles.bothText}>Both!</Text>
      </Pressable>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', marginBottom: 32 },
  cards: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  card: { flex: 1, backgroundColor: '#161B22', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: '#30363D' },
  selectedCrypto: { borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.1)' },
  selectedFinance: { borderColor: '#58A6FF', backgroundColor: 'rgba(88,166,255,0.1)' },
  bigIcon: { fontSize: 40, marginBottom: 12 },
  cardTitle: { fontFamily: 'Inter', fontSize: 18, fontWeight: '700', color: '#E6EDF3', marginBottom: 4 },
  cardDesc: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', textAlign: 'center' },
  both: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#161B22', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#30363D' },
  selectedBoth: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)' },
  bothText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: '#E6EDF3' },
});
