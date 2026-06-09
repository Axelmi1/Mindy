import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MindyTurn } from '../components/MindyTurn';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { suggestUsername, isValidUsername } from '../lib/usernameSuggest';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupStep() {
  const next = useOnboardingStore((s) => s.next);
  const username = useOnboardingStore((s) => s.username);
  const setUsername = useOnboardingStore((s) => s.setUsername);
  const email = useOnboardingStore((s) => s.email);
  const setEmail = useOnboardingStore((s) => s.setEmail);
  const password = useOnboardingStore((s) => s.password);
  const setPassword = useOnboardingStore((s) => s.setPassword);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  const suggested = useMemo(() => suggestUsername(Date.now()), []);
  useEffect(() => {
    if (!username) setUsername(suggested);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [emailText, setEmailText] = useState(email ?? '');
  const [pwText, setPwText] = useState(password ?? '');

  const usernameOk = isValidUsername(username);
  const emailOk = EMAIL_RE.test(emailText.trim());
  const pwOk = pwText.length >= 8;
  const valid = usernameOk && emailOk && pwOk;

  const handleNext = () => {
    setEmail(emailText.trim());
    setPassword(pwText);
    next();
  };

  return (
    <MindyTurn
      turnKey="signup"
      mood="neutral"
      message="Crée ton compte — pseudo, email et mot de passe."
      ctaLabel="Continuer"
      ctaDisabled={!valid}
      onCta={handleNext}
      keyboardAware
    >
      <View style={styles.field}>
        <Text style={styles.at}>@</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="satoshi"
          placeholderTextColor="#484F58"
          style={[styles.input, usernameOk ? styles.inputOk : styles.inputBad]}
        />
      </View>
      <Text style={styles.hint}>Lettres, chiffres, underscore — 3 à 20 caractères.</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={emailText}
        onChangeText={setEmailText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="ton@email.com"
        placeholderTextColor="#484F58"
        style={[styles.input, emailText.length === 0 || emailOk ? styles.inputOk : styles.inputBad]}
      />
      <Text style={styles.hint}>Sert à te reconnecter sur un autre téléphone.</Text>

      <Text style={styles.label}>Mot de passe</Text>
      <TextInput
        value={pwText}
        onChangeText={setPwText}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        placeholder="8 caractères minimum"
        placeholderTextColor="#484F58"
        style={[styles.input, pwText.length === 0 || pwOk ? styles.inputOk : styles.inputBad]}
      />
      <Text style={styles.hint}>Au moins 8 caractères.</Text>
    </MindyTurn>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  at: { fontFamily: 'JetBrainsMono', fontSize: 22, color: '#39FF14' },
  input: {
    flex: 1, fontFamily: 'Inter', fontSize: 16, color: '#E6EDF3',
    backgroundColor: '#161B22', borderRadius: 12, borderWidth: 2, padding: 14,
  },
  inputOk: { borderColor: '#30363D' },
  inputBad: { borderColor: '#F85149' },
  label: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', marginTop: 16, marginBottom: 6 },
  hint: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', marginTop: 6 },
});
