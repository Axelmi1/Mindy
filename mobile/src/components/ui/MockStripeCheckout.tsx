/**
 * MockStripeCheckout
 *
 * Realistic Stripe Checkout simulation for Epitech demo.
 * No real Stripe integration — purely UI.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  FadeInDown,
} from 'react-native-reanimated';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MockStripeCheckoutProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (plan: string) => void;
  amount: string;
  planLabel: string;
  userId: string;
  plan: string;
}

type Step = 'form' | 'processing' | 'success';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

function detectCardBrand(number: string): 'visa' | 'mastercard' | null {
  const first = number.replace(/\s/g, '')[0];
  if (first === '4') return 'visa';
  if (first === '5') return 'mastercard';
  return null;
}

function generateTxnRef(): string {
  const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  return `TXN-${digits}`;
}

// ─── Processing Messages ─────────────────────────────────────────────────────

const PROCESSING_MESSAGES = ['Traitement en cours...', 'Vérification...', 'Confirmation...'];

// ─── Component ───────────────────────────────────────────────────────────────

export function MockStripeCheckout({
  visible,
  onClose,
  onSuccess,
  amount,
  planLabel,
  plan,
}: MockStripeCheckoutProps) {
  const [step, setStep] = useState<Step>('form');

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Processing state
  const [processingMsg, setProcessingMsg] = useState(0);
  const [txnRef, setTxnRef] = useState('');

  // Reset on open
  useEffect(() => {
    if (visible) {
      setStep('form');
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setName('');
      setErrors({});
      setProcessingMsg(0);
    }
  }, [visible]);

  // Processing message rotation
  useEffect(() => {
    if (step !== 'processing') return;
    setProcessingMsg(0);
    const interval = setInterval(() => {
      setProcessingMsg((prev) => {
        if (prev >= PROCESSING_MESSAGES.length - 1) return prev;
        return prev + 1;
      });
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setTxnRef(generateTxnRef());
      setStep('success');
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [step]);

  // Validation
  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length !== 16) e.card = 'Numéro à 16 chiffres requis';

    const expiryDigits = expiry.replace('/', '');
    if (expiryDigits.length !== 4) {
      e.expiry = 'Format MM/AA requis';
    } else {
      const month = parseInt(expiryDigits.slice(0, 2), 10);
      if (month < 1 || month > 12) e.expiry = 'Mois invalide (01-12)';
    }

    const cvcDigits = cvc.replace(/\D/g, '');
    if (cvcDigits.length !== 3) e.cvc = '3 chiffres requis';

    if (!name.trim()) e.name = 'Nom requis';

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [cardNumber, expiry, cvc, name]);

  const handlePay = useCallback(() => {
    if (!validate()) return;
    setStep('processing');
  }, [validate]);

  const handleFinish = useCallback(() => {
    onSuccess(plan);
  }, [onSuccess, plan]);

  const brand = detectCardBrand(cardNumber);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.keyboardView}
        >
          <View style={s.container}>
            {/* ─── Step 1: Form ─────────────────────────── */}
            {step === 'form' && (
              <ScrollView
                style={s.scrollView}
                contentContainerStyle={s.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View style={s.header}>
                  <Pressable style={s.closeBtn} onPress={onClose} hitSlop={12}>
                    <Text style={s.closeBtnText}>✕</Text>
                  </Pressable>
                  <Text style={s.lockIcon}>🔒</Text>
                  <Text style={s.headerTitle}>Paiement sécurisé</Text>
                  <Text style={s.amountBig}>{amount} / mois</Text>
                  <Text style={s.planLabelText}>{planLabel}</Text>
                </View>

                {/* Card number */}
                <View style={s.fieldGroup}>
                  <Text style={s.label}>Numéro de carte</Text>
                  <View style={[s.inputRow, errors.card ? s.inputError : null]}>
                    <TextInput
                      style={s.input}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor="#A3A3A3"
                      keyboardType="number-pad"
                      maxLength={19}
                      value={cardNumber}
                      onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                    />
                    {brand && (
                      <Text style={s.brandIcon}>
                        {brand === 'visa' ? '𝗩𝗜𝗦𝗔' : '⬤⬤'}
                      </Text>
                    )}
                  </View>
                  {errors.card && <Text style={s.errorText}>{errors.card}</Text>}
                </View>

                {/* Expiry + CVC */}
                <View style={s.row}>
                  <View style={[s.fieldGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={s.label}>MM/AA</Text>
                    <View style={[s.inputRow, errors.expiry ? s.inputError : null]}>
                      <TextInput
                        style={s.input}
                        placeholder="MM/AA"
                        placeholderTextColor="#A3A3A3"
                        keyboardType="number-pad"
                        maxLength={5}
                        value={expiry}
                        onChangeText={(t) => setExpiry(formatExpiry(t))}
                      />
                    </View>
                    {errors.expiry && <Text style={s.errorText}>{errors.expiry}</Text>}
                  </View>
                  <View style={[s.fieldGroup, { flex: 1 }]}>
                    <Text style={s.label}>CVC</Text>
                    <View style={[s.inputRow, errors.cvc ? s.inputError : null]}>
                      <TextInput
                        style={s.input}
                        placeholder="•••"
                        placeholderTextColor="#A3A3A3"
                        keyboardType="number-pad"
                        maxLength={3}
                        secureTextEntry
                        value={cvc}
                        onChangeText={(t) => setCvc(t.replace(/\D/g, ''))}
                      />
                    </View>
                    {errors.cvc && <Text style={s.errorText}>{errors.cvc}</Text>}
                  </View>
                </View>

                {/* Name */}
                <View style={s.fieldGroup}>
                  <Text style={s.label}>Nom sur la carte</Text>
                  <View style={[s.inputRow, errors.name ? s.inputError : null]}>
                    <TextInput
                      style={s.input}
                      placeholder="Jean Dupont"
                      placeholderTextColor="#A3A3A3"
                      autoCapitalize="words"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  {errors.name && <Text style={s.errorText}>{errors.name}</Text>}
                </View>

                {/* Pay button */}
                <Pressable style={s.payBtn} onPress={handlePay}>
                  <Text style={s.payBtnText}>Payer {amount}</Text>
                </Pressable>

                {/* Footer */}
                <View style={s.footerStripe}>
                  <Text style={s.footerText}>
                    🔒 Propulsé par Stripe · Paiement crypté SSL
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* ─── Step 2: Processing ──────────────────── */}
            {step === 'processing' && (
              <Animated.View entering={FadeIn.duration(200)} style={s.center}>
                <ActivityIndicator size="large" color="#7C3AED" style={s.spinner} />
                <Text style={s.processingText}>
                  {PROCESSING_MESSAGES[processingMsg]}
                </Text>
              </Animated.View>
            )}

            {/* ─── Step 3: Success ─────────────────────── */}
            {step === 'success' && (
              <Animated.View entering={FadeIn.duration(200)} style={s.center}>
                <Animated.Text entering={ZoomIn.duration(400)} style={s.successCheck}>
                  ✅
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(200)} style={s.successTitle}>
                  Paiement confirmé !
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(350)} style={s.successSub}>
                  Bienvenue dans Mindly Pro 👑
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(450)} style={s.txnRef}>
                  Réf. {txnRef}
                </Animated.Text>
                <Animated.View entering={FadeInDown.delay(550)}>
                  <Pressable style={s.startBtn} onPress={handleFinish}>
                    <Text style={s.startBtnText}>Commencer</Text>
                  </Pressable>
                </Animated.View>
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 480,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  lockIcon: { fontSize: 20, marginBottom: 4 },
  headerTitle: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  amountBig: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  planLabelText: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  // Form fields
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    height: 48,
  },
  inputError: { borderColor: '#EF4444' },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  brandIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
    marginLeft: 8,
  },
  row: { flexDirection: 'row' },
  errorText: { color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 2 },

  // Pay button
  payBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  // Stripe footer
  footerStripe: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: { fontSize: 11, color: '#9CA3AF' },

  // Processing
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    paddingHorizontal: 32,
  },
  spinner: { marginBottom: 20 },
  processingText: { fontSize: 16, color: '#6B7280', fontWeight: '500' },

  // Success
  successCheck: { fontSize: 56, marginBottom: 16 },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  successSub: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
  txnRef: { fontSize: 12, color: '#D1D5DB', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 32 },
  startBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
