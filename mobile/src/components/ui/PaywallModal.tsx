/**
 * PaywallModal
 *
 * Full-screen premium upgrade modal with:
 * - Plan comparison (Free vs Pro Monthly vs Pro Annual)
 * - Animated gradient header
 * - Feature checklist
 * - CTA with loading state
 * - "Best value" badge on annual plan
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { subscriptionsApi, type SubscriptionPlan, type PlanDetails } from '@/api/client';
import { MockStripeCheckout } from './MockStripeCheckout';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#0D1117',
  surface: '#161B22',
  border: 'rgba(255,255,255,0.08)',
  primary: '#39FF14',
  gold: '#FFD700',
  text: '#E6EDF3',
  muted: '#8B949E',
  pro: '#7C3AED',
  proLight: '#A78BFA',
};

const PRO_FEATURES = [
  { icon: '∞', label: 'Unlimited lessons' },
  { icon: '🤖', label: 'AI-powered learning path' },
  { icon: '📊', label: 'Advanced analytics dashboard' },
  { icon: '❄️', label: '10 streak freezes / month' },
  { icon: '📡', label: 'Full offline mode' },
  { icon: '🚫', label: 'Ad-free experience' },
  { icon: '👑', label: 'Pro profile badge' },
  { icon: '🏆', label: 'Priority leaderboard' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onSubscribed?: (plan: SubscriptionPlan) => void;
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: PlanDetails;
  selected: boolean;
  onSelect: () => void;
}) {
  const isAnnual = plan.plan === 'PRO_ANNUAL';
  const isFree = plan.plan === 'FREE';

  return (
    <Pressable
      style={[
        styles.planCard,
        selected && styles.planCardSelected,
        isAnnual && styles.planCardAnnual,
      ]}
      onPress={onSelect}
    >
      {isAnnual && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>BEST VALUE · SAVE 33%</Text>
        </View>
      )}

      <View style={styles.planRow}>
        <View style={styles.planRadio}>
          <View style={[styles.planRadioInner, selected && styles.planRadioActive]} />
        </View>

        <View style={styles.planInfo}>
          <Text style={styles.planName}>{plan.name}</Text>
          {plan.interval && (
            <Text style={styles.planInterval}>
              {isAnnual ? 'billed annually' : 'billed monthly'}
            </Text>
          )}
        </View>

        <View style={styles.planPriceBlock}>
          {isFree ? (
            <Text style={styles.planPrice}>Free</Text>
          ) : (
            <>
              <Text style={styles.planPrice}>
                ${plan.price.toFixed(2)}
              </Text>
              <Text style={styles.planPriceSuffix}>/{plan.interval}</Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PaywallModal({ visible, onClose, userId, onSubscribed }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('PRO_ANNUAL');
  const [loading, setLoading] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  const plans: PlanDetails[] = [
    {
      plan: 'PRO_MONTHLY',
      name: 'Pro Monthly',
      price: 9.99,
      currency: 'USD',
      interval: 'month',
      features: [],
    },
    {
      plan: 'PRO_ANNUAL',
      name: 'Pro Annual',
      price: 79.99,
      currency: 'USD',
      interval: 'year',
      features: [],
    },
  ];

  const selectedPlanDetails = plans.find((p) => p.plan === selectedPlan)!;
  const checkoutAmount =
    selectedPlan === 'PRO_ANNUAL'
      ? `${selectedPlanDetails.price.toFixed(2)} €`
      : `${selectedPlanDetails.price.toFixed(2)} €`;
  const checkoutLabel =
    selectedPlan === 'PRO_ANNUAL' ? 'Pro Annuel' : 'Pro Mensuel';

  const handleSubscribe = useCallback(() => {
    setCheckoutVisible(true);
  }, []);

  const handleCheckoutSuccess = useCallback(async (plan: string) => {
    setCheckoutVisible(false);
    setLoading(true);
    try {
      await subscriptionsApi.subscribe(userId, selectedPlan);
      onSubscribed?.(selectedPlan);
      onClose();
    } catch (err: any) {
      Alert.alert('Erreur', err.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedPlan, onClose, onSubscribed]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Gradient Header */}
        <LinearGradient
          colors={['#1a0a3c', '#0D1117']}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']}>
            <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>

              <View style={styles.crownContainer}>
                <Text style={styles.crown}>👑</Text>
                <LinearGradient
                  colors={[COLORS.pro, COLORS.proLight, COLORS.pro]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.proGradientBadge}
                >
                  <Text style={styles.proGradientText}>MINDLY PRO</Text>
                </LinearGradient>
              </View>

              <Text style={styles.headline}>Unlock Your Full{'\n'}Financial Education</Text>
              <Text style={styles.subheadline}>
                Join 10,000+ learners mastering crypto & finance
              </Text>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Feature list */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.featuresContainer}>
            <View style={styles.featureGrid}>
              {PRO_FEATURES.map((f, i) => (
                <Animated.View
                  key={f.label}
                  entering={FadeInDown.delay(200 + i * 40)}
                  style={styles.featureItem}
                >
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Plan selection */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.plansSection}>
            <Text style={styles.sectionTitle}>Choose your plan</Text>
            {plans.map((plan) => (
              <PlanCard
                key={plan.plan}
                plan={plan}
                selected={selectedPlan === plan.plan}
                onSelect={() => setSelectedPlan(plan.plan)}
              />
            ))}
          </Animated.View>

          {/* Legal disclaimer */}
          <Text style={styles.legal}>
            Subscription renews automatically. Cancel anytime in Settings.
            By subscribing you agree to our Terms of Service.
          </Text>
        </ScrollView>

        {/* CTA Footer */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.bg }]} />
          )}

          <Pressable
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#333', '#222'] : [COLORS.pro, '#5B21B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.ctaText}>
                    Start Pro{' '}
                    <Text style={styles.ctaPrice}>
                      {selectedPlan === 'PRO_ANNUAL' ? '· $79.99/yr' : '· $9.99/mo'}
                    </Text>
                  </Text>
                  <Text style={styles.ctaSub}>
                    {selectedPlan === 'PRO_ANNUAL' ? '≈ $6.67/month · 2 months free' : 'Cancel anytime'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </SafeAreaView>

        <MockStripeCheckout
          visible={checkoutVisible}
          onClose={() => setCheckoutVisible(false)}
          onSuccess={handleCheckoutSuccess}
          amount={checkoutAmount}
          planLabel={checkoutLabel}
          userId={userId}
          plan={selectedPlan}
        />
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  headerGradient: { paddingBottom: 24 },
  header: { paddingHorizontal: 24, paddingTop: 8, alignItems: 'center' },
  closeBtn: {
    position: 'absolute',
    right: 24,
    top: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  closeBtnText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
  crownContainer: { alignItems: 'center', marginTop: 16, marginBottom: 12 },
  crown: { fontSize: 44, marginBottom: 8 },
  proGradientBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  proGradientText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  headline: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 34,
  },
  subheadline: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },

  // Body
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 },

  // Features
  featuresContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  featureIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  featureLabel: { color: COLORS.text, fontSize: 13, flex: 1 },

  // Plans
  plansSection: { marginBottom: 16 },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  planCardSelected: { borderColor: COLORS.pro },
  planCardAnnual: { borderColor: `${COLORS.pro}60` },
  bestValueBadge: {
    backgroundColor: COLORS.pro,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  bestValueText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioInner: { width: 10, height: 10, borderRadius: 5 },
  planRadioActive: { backgroundColor: COLORS.pro },
  planInfo: { flex: 1 },
  planName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  planInterval: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  planPriceBlock: { alignItems: 'flex-end' },
  planPrice: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  planPriceSuffix: { color: COLORS.muted, fontSize: 12 },

  // Legal
  legal: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },

  // CTA Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctaBtn: { borderRadius: 16, overflow: 'hidden' },
  ctaBtnDisabled: { opacity: 0.7 },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  ctaPrice: { fontWeight: '600', opacity: 0.9 },
  ctaSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
});
