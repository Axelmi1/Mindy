import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { MindyMessage } from '@/components/MindyMessage';
import { MindyMood } from '@/components/mindy/MindyMascot';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  /** Mood courant — pilote aussi la mascotte du layout via le store si besoin. */
  mood?: MindyMood;
  /** Message tapé par Mindy. */
  message: string;
  /** Contenu de réponse (cartes, input, quiz...). */
  children: React.ReactNode;
  /** Libellé du bouton principal. */
  ctaLabel?: string;
  onCta?: () => void;
  /** Désactive le CTA tant que pas prêt (ex. pas de sélection). */
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  /** Bouton secondaire optionnel (ghost). */
  secondary?: React.ReactNode;
  keyboardAware?: boolean;
  /** clé unique de l'écran pour rejouer l'animation d'entrée. */
  turnKey: string;
}

export function MindyTurn({
  mood = 'neutral', message, children,
  ctaLabel, onCta, ctaDisabled, ctaLoading, secondary,
  keyboardAware, turnKey,
}: Props) {
  // Le CTA reste verrouillé tant que Mindy n'a pas fini de "parler".
  const [typingDone, setTypingDone] = useState(false);

  // Re-verrouille le CTA à chaque nouvel écran/message (ex. les 3 questions du quiz
  // partagent la même instance de MindyTurn : sans ce reset, le verrou anti-spoil
  // ne marcherait qu'à la 1re question).
  useEffect(() => { setTypingDone(false); }, [turnKey, message]);

  // Callback stable : sinon MindyMessage relance le typing à chaque render du parent,
  // ce qui peut empêcher onComplete de se déclencher → CTA bloqué à vie.
  const handleTypingComplete = useCallback(() => setTypingDone(true), []);

  const body = (
    <Animated.View
      key={turnKey}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(150)}
      style={styles.flex1}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MindyMessage
          message={message}
          mood={mood}
          onComplete={handleTypingComplete}
        />
        <View style={styles.answers}>{children}</View>
      </ScrollView>

      {(ctaLabel || secondary) && (
        <View style={styles.footer}>
          {ctaLabel && (
            <PrimaryButton
              onPress={onCta ?? (() => {})}
              disabled={ctaDisabled || !typingDone}
              loading={ctaLoading}
            >
              {ctaLabel}
            </PrimaryButton>
          )}
          {secondary}
        </View>
      )}
    </Animated.View>
  );

  if (!keyboardAware) return body;
  return (
    <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {body}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, flexGrow: 1 },
  answers: { marginTop: 24, gap: 12 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, gap: 12 },
});
