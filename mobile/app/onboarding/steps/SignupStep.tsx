import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MindyTurn } from '../components/MindyTurn';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { suggestUsername, isValidUsername } from '../lib/usernameSuggest';

export function SignupStep() {
  const next = useOnboardingStore((s) => s.next);
  const username = useOnboardingStore((s) => s.username);
  const setUsername = useOnboardingStore((s) => s.setUsername);
  const email = useOnboardingStore((s) => s.email);
  const setEmail = useOnboardingStore((s) => s.setEmail);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  // Pré-remplit un pseudo suggéré une seule fois si vide.
  const suggested = useMemo(() => suggestUsername(Date.now()), []);
  useEffect(() => {
    if (!username) setUsername(suggested);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [emailText, setEmailText] = useState(email ?? '');
  const valid = isValidUsername(username);

  const handleNext = () => {
    setEmail(emailText.trim() ? emailText.trim() : null);
    next();
  };

  return (
    <MindyTurn
      turnKey="signup"
      mood="neutral"
      message="Choisis ton pseudo — c'est comme ça que tu apparaîtras dans le classement."
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
          style={[styles.input, valid ? styles.inputOk : styles.inputBad]}
        />
      </View>
      <Text style={styles.hint}>Lettres, chiffres, underscore — 3 à 20 caractères.</Text>

      <Text style={styles.label}>Email (optionnel)</Text>
      <TextInput
        value={emailText}
        onChangeText={setEmailText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="ton@email.com"
        placeholderTextColor="#484F58"
        style={[styles.input, styles.inputOk]}
      />
      <Text style={styles.hint}>Pour récupérer ton compte sur un autre téléphone.</Text>
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
