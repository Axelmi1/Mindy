import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

function isValidUsername(u: string) {
  const t = u.trim();
  return t.length >= 3 && t.length <= 20 && /^[a-zA-Z0-9_]+$/.test(t);
}

function isValidEmail(e: string) {
  if (!e.trim()) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

export function SignupStep() {
  const setUsername = useOnboardingStore((s) => s.setUsername);
  const setEmail = useOnboardingStore((s) => s.setEmail);
  const next = useOnboardingStore((s) => s.next);

  const [u, setU] = useState('');
  const [e, setE] = useState('');
  const [uErr, setUErr] = useState('');
  const [eErr, setEErr] = useState('');

  const submit = () => {
    const tU = u.trim();
    const tE = e.trim();
    if (!isValidUsername(tU)) {
      setUErr('3-20 chars, letters/numbers/underscore only');
      return;
    }
    if (!isValidEmail(tE)) {
      setEErr('Invalid email');
      return;
    }
    setUErr(''); setEErr('');
    setUsername(tU);
    setEmail(tE || null);
    next();
  };

  return (
    <OnboardingScreen
      animationKey="signup"
      keyboardAware
      footer={
        <PrimaryButton onPress={submit} disabled={!isValidUsername(u)}>
          Continue
        </PrimaryButton>
      }
    >
      <Animated.View entering={FadeIn.duration(400)}>
        <View style={styles.header}>
          <Icon name="user" size={48} color="#39FF14" />
          <Text style={styles.title}>Choose a username</Text>
          <Text style={styles.subtitle}>This is how you'll appear on the leaderboard.</Text>
        </View>

        <View style={styles.inputWrap}>
          <View style={[styles.input, uErr ? styles.inputError : u.length >= 3 && styles.inputValid]}>
            <Text style={styles.prefix}>@</Text>
            <TextInput
              value={u}
              onChangeText={(v) => { setU(v); setUErr(''); }}
              placeholder="satoshi"
              placeholderTextColor="#484F58"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              style={styles.textInput}
            />
            {isValidUsername(u) && <Icon name="check" size={18} color="#39FF14" />}
          </View>
          <Text style={uErr ? styles.errorText : styles.hint}>
            {uErr || 'Letters, numbers, underscore — 3 to 20 chars'}
          </Text>
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>Email (optional)</Text>
          <View style={[styles.input, eErr && styles.inputError]}>
            <TextInput
              value={e}
              onChangeText={(v) => { setE(v); setEErr(''); }}
              placeholder="your@email.com"
              placeholderTextColor="#484F58"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.textInput}
            />
          </View>
          <Text style={eErr ? styles.errorText : styles.hint}>
            {eErr || 'To recover your account on another device'}
          </Text>
        </View>
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', marginTop: 12, textAlign: 'center' },
  subtitle: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', textAlign: 'center', marginTop: 6 },
  inputWrap: { marginBottom: 18 },
  label: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', marginBottom: 6 },
  input: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161B22', borderRadius: 14, borderWidth: 2, borderColor: '#30363D', paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  inputValid: { borderColor: '#39FF14' },
  inputError: { borderColor: '#F85149' },
  prefix: { fontFamily: 'JetBrainsMono', fontSize: 18, color: '#39FF14', fontWeight: '700' },
  textInput: { flex: 1, fontFamily: 'JetBrainsMono', fontSize: 16, color: '#E6EDF3', padding: 0 },
  hint: { fontFamily: 'Inter', fontSize: 11, color: '#484F58', marginTop: 4, paddingHorizontal: 4 },
  errorText: { fontFamily: 'Inter', fontSize: 12, color: '#F85149', marginTop: 4, paddingHorizontal: 4 },
});
