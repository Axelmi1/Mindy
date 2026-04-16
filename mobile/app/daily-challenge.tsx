import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  ZoomIn,
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { dailyChallengeApi, DailyChallenge } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/hooks/useSound';
import { MindyMessage } from '@/components/MindyMessage';
import { Icon } from '@/components/ui/Icon';
import { Confetti, XpCounter, StreakFire } from '@/components/animations';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

const { width: SW } = Dimensions.get('window');

type ScreenState = 'loading' | 'ready' | 'completed' | 'already_done' | 'error';

function PulsingRing({ color, delay = 0 }: { color: string; delay?: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1.6, { duration: 1200, easing: Easing.out(Easing.ease) })
      ),
      -1, false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 0 }),
        withTiming(0, { duration: 1200 })
      ),
      -1, false
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    borderColor: color,
  }));
  return <Animated.View style={[styles.pulseRing, style]} />;
}

function CountdownTimer({ timeUntilReset }: { timeUntilReset: string }) {
  return (
    <View style={styles.timerRow}>
      <Icon name="clock" size={14} color="#FFD700" />
      <Text style={styles.timerText}>Reset dans </Text>
      <Text style={styles.timerValue}>{timeUntilReset}</Text>
    </View>
  );
}

export default function DailyChallengeScreen() {
  const { userId, isLoading: isUserLoading } = useUser();
  const { play: playSound } = useSound();

  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  useEffect(() => {
    if (!userId || isUserLoading) return;
    (async () => {
      try {
        const res = await dailyChallengeApi.getToday(userId);
        if (res.success && res.data) {
          setChallenge(res.data);
          setTimeUntilReset(formatTime(res.data.timeUntilReset));
          setScreenState(res.data.isCompleted ? 'already_done' : 'ready');

          // Live countdown
          let remaining = res.data.timeUntilReset;
          intervalRef.current = setInterval(() => {
            remaining = Math.max(0, remaining - 60000);
            setTimeUntilReset(formatTime(remaining));
          }, 60000);
        } else {
          setScreenState('error');
        }
      } catch {
        setScreenState('error');
      }
    })();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [userId, isUserLoading]);

  const handleStart = useCallback(async () => {
    if (!challenge) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push(`/lesson/${challenge.lessonId}`);
  }, [challenge]);

  const handleComplete = useCallback(async () => {
    if (!userId || !challenge) return;
    try {
      const res = await dailyChallengeApi.complete(userId);
      if (res.success && res.data) {
        setXpAwarded(res.data.xpAwarded || 0);
        setShowConfetti(true);
        playSound?.('complete');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScreenState('completed');
      }
    } catch {}
  }, [userId, challenge]);

  const domainColor = (d?: string) =>
    d === 'CRYPTO' ? '#39FF14' : d === 'FINANCE' ? '#58A6FF' : '#FF8C00';

  // ─── LOADING ───────────────────────────────────────────────────────────────
  if (screenState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#8B949E" />
          </Pressable>
        </View>
        <View style={{ padding: 24, gap: 16 }}>
          <SkeletonBox height={180} borderRadius={20} />
          <SkeletonBox height={80} borderRadius={16} />
          <SkeletonBox height={60} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── ERROR ─────────────────────────────────────────────────────────────────
  if (screenState === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#8B949E" />
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <Text style={{ fontSize: 48 }}>😔</Text>
          <Text style={styles.errorTitle}>Pas de défi aujourd'hui</Text>
          <Text style={styles.errorSub}>Reviens demain ou vérifie ta connexion.</Text>
          <Pressable style={styles.backButton2} onPress={() => router.back()}>
            <Text style={styles.backButton2Text}>Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── COMPLETED (vient de finir) ────────────────────────────────────────────
  if (screenState === 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        {showConfetti && <Confetti count={100} onComplete={() => setShowConfetti(false)} />}
        <ScrollView contentContainerStyle={styles.centerContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={ZoomIn.duration(500)} style={styles.completedHero}>
            <LinearGradient
              colors={['rgba(255,215,0,0.15)', 'rgba(22,27,34,0.98)']}
              style={StyleSheet.absoluteFill}
            />
            <Animated.Text entering={BounceIn.delay(200)} style={{ fontSize: 80 }}>🏆</Animated.Text>
            <Animated.Text entering={FadeInUp.delay(300)} style={styles.completedTitle}>
              Défi Terminé !
            </Animated.Text>
            <Animated.View entering={FadeInUp.delay(400)} style={styles.xpRow}>
              <XpCounter value={xpAwarded} showPlus size="large" />
              <View style={styles.bonusTag}>
                <Text style={styles.bonusTagText}>🔥 BONUS x2</Text>
              </View>
            </Animated.View>
            {challenge && (
              <Animated.Text entering={FadeInUp.delay(500)} style={styles.completedLesson}>
                {challenge.lesson?.title ?? 'Daily Challenge'}
              </Animated.Text>
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600)}>
            <MindyMessage message="Défi du jour coché. Streak protégé. Viens demain pour la suite. 🔥" mood="hype" />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(700)} style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>🔥 +1</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>⚡ +{xpAwarded}</Text>
              <Text style={styles.statLabel}>XP gagné</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(800)} style={{ width: '100%' }}>
            <Pressable style={styles.ctaBtn} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.ctaBtnText}>Retour à l'accueil</Text>
              <Icon name="arrow-right" size={18} color="#0D1117" />
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── ALREADY DONE ──────────────────────────────────────────────────────────
  if (screenState === 'already_done') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#8B949E" />
          </Pressable>
          <CountdownTimer timeUntilReset={timeUntilReset} />
        </View>
        <ScrollView contentContainerStyle={styles.centerContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={ZoomIn.duration(400)} style={styles.doneHero}>
            <LinearGradient
              colors={['rgba(35,134,54,0.2)', 'rgba(22,27,34,0.98)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={{ fontSize: 64 }}>✅</Text>
            <Text style={styles.doneTitle}>Déjà fait aujourd'hui !</Text>
            <Text style={styles.doneSub}>Tu reviens demain pour garder ton streak.</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200)}>
            <MindyMessage message="Défi bouclé. Streak maintenu. Maintenant va apprendre autre chose. 📚" mood="hype" />
          </Animated.View>

          {challenge && (
            <Animated.View entering={FadeInUp.delay(300)} style={styles.practiceCard}>
              <Text style={styles.practiceTitle}>Veux-tu t'entraîner ?</Text>
              <Text style={styles.practiceSub}>Rejoue la leçon sans impact sur ta progression.</Text>
              <Pressable
                style={styles.practiceBtn}
                onPress={() => router.push(`/lesson/${challenge.lessonId}?practice=true` as any)}
              >
                <Icon name="refresh" size={16} color="#58A6FF" />
                <Text style={styles.practiceBtnText}>Mode Practice</Text>
              </Pressable>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(400)} style={{ width: '100%' }}>
            <Pressable style={styles.backButton3} onPress={() => router.back()}>
              <Text style={styles.backButton3Text}>Retour</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── READY ─────────────────────────────────────────────────────────────────
  const color = domainColor(challenge?.lesson?.domain);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color="#8B949E" />
        </Pressable>
        <CountdownTimer timeUntilReset={timeUntilReset} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(255,215,0,0.12)', 'rgba(22,27,34,0.98)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Pulsing rings */}
          <View style={styles.pulseContainer}>
            <PulsingRing color="#FFD700" />
            <PulsingRing color="#FFD700" delay={400} />
            <View style={styles.heroIconBg}>
              <Text style={{ fontSize: 48 }}>⚡</Text>
            </View>
          </View>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>🎯 DAILY CHALLENGE</Text>
          </View>

          <Text style={styles.heroDate}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </Animated.View>

        {/* Challenge Info */}
        {challenge && (
          <Animated.View entering={FadeInUp.delay(150)} style={styles.challengeCard}>
            <View style={styles.challengeTop}>
              <View style={[styles.domainTag, { backgroundColor: color + '20', borderColor: color }]}>
                <Text style={[styles.domainTagText, { color }]}>{challenge.lesson?.domain}</Text>
              </View>
              <View style={styles.stepsTag}>
                <Icon name="book" size={12} color="#8B949E" />
                <Text style={styles.stepsTagText}>{challenge.lesson?.content?.steps?.length ?? '?'} étapes</Text>
              </View>
            </View>

            <Text style={styles.challengeTitle}>
              {challenge.lesson?.title ?? 'Daily Challenge'}
            </Text>

            {/* XP Reward */}
            <View style={styles.xpCard}>
              <View>
                <Text style={styles.xpLabel}>RÉCOMPENSE</Text>
                <View style={styles.xpValueRow}>
                  <Text style={styles.xpValue}>+{challenge.xpBonus ?? 100}</Text>
                  <Text style={styles.xpUnit}> XP</Text>
                </View>
              </View>
              <View style={styles.xpBonusBadge}>
                <Text style={styles.xpBonusText}>🔥 x2 BONUS</Text>
              </View>
            </View>

            <MindyMessage
              message={`Défi du jour. Une seule chance. ${challenge.lesson?.domain === 'CRYPTO' ? '₿' : '📈'} Vas-y.`}
              mood="hype"
            />
          </Animated.View>
        )}

        {/* Streak Info */}
        <Animated.View entering={FadeInUp.delay(250)} style={styles.streakCard}>
          <Icon name="flame" size={18} color="#FF6B35" />
          <Text style={styles.streakText}>Complete pour maintenir ton streak</Text>
          <Icon name="shield" size={18} color="#58A6FF" />
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Pressable style={styles.ctaBtn} onPress={handleStart}>
            <Text style={styles.ctaBtnText}>Commencer le défi ⚡</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  timerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
  },
  timerText: { fontSize: 11, color: '#8B949E', fontFamily: 'Inter' },
  timerValue: { fontSize: 12, color: '#FFD700', fontFamily: 'JetBrainsMono', fontWeight: '700' },

  content: { padding: 20, gap: 16, paddingBottom: 40 },
  centerContent: { padding: 24, gap: 20, alignItems: 'center', paddingBottom: 40 },

  // Hero
  heroCard: {
    borderRadius: 24, overflow: 'hidden', padding: 32,
    alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    backgroundColor: '#161B22',
  },
  pulseContainer: {
    width: 100, height: 100,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 90, height: 90,
    borderRadius: 45, borderWidth: 2,
  },
  heroIconBg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,215,0,0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,215,0,0.4)',
  },
  heroBadge: {
    backgroundColor: '#FFD700', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '800', color: '#0D1117', fontFamily: 'JetBrainsMono', letterSpacing: 1 },
  heroDate: { fontSize: 13, color: '#8B949E', fontFamily: 'Inter', textTransform: 'capitalize' },

  // Challenge card
  challengeCard: {
    backgroundColor: '#161B22', borderRadius: 20,
    borderWidth: 1, borderColor: '#21262D', padding: 20, gap: 14,
  },
  challengeTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  domainTag: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  domainTagText: { fontSize: 11, fontWeight: '700', fontFamily: 'JetBrainsMono' },
  stepsTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stepsTagText: { fontSize: 12, color: '#8B949E', fontFamily: 'Inter' },
  challengeTitle: {
    fontSize: 22, fontWeight: '700', color: '#E6EDF3',
    fontFamily: 'Inter', lineHeight: 30,
  },
  xpCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,215,0,0.06)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)', padding: 16,
  },
  xpLabel: { fontSize: 9, fontWeight: '700', color: '#8B949E', fontFamily: 'JetBrainsMono', letterSpacing: 1, marginBottom: 4 },
  xpValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  xpValue: { fontSize: 36, fontWeight: '800', color: '#FFD700', fontFamily: 'JetBrainsMono' },
  xpUnit: { fontSize: 18, fontWeight: '700', color: '#FFD700', fontFamily: 'JetBrainsMono' },
  xpBonusBadge: {
    backgroundColor: 'rgba(255,107,53,0.2)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.4)',
  },
  xpBonusText: { fontSize: 12, fontWeight: '700', color: '#FF6B35', fontFamily: 'JetBrainsMono' },

  // Streak card
  streakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#161B22', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#21262D',
  },
  streakText: { fontSize: 13, color: '#8B949E', fontFamily: 'Inter' },

  // CTA
  ctaBtn: {
    backgroundColor: '#FFD700', borderRadius: 16,
    paddingVertical: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '800', color: '#0D1117', fontFamily: 'Inter' },

  // Completed
  completedHero: {
    width: '100%', borderRadius: 24, overflow: 'hidden',
    padding: 40, alignItems: 'center', gap: 16,
    borderWidth: 2, borderColor: 'rgba(255,215,0,0.5)',
    backgroundColor: '#161B22',
  },
  completedTitle: { fontSize: 28, fontWeight: '800', color: '#FFD700', fontFamily: 'Inter' },
  completedLesson: { fontSize: 14, color: '#8B949E', fontFamily: 'Inter', textAlign: 'center' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bonusTag: {
    backgroundColor: 'rgba(255,107,53,0.2)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.4)',
  },
  bonusTagText: { fontSize: 11, fontWeight: '700', color: '#FF6B35', fontFamily: 'JetBrainsMono' },
  statsRow: {
    flexDirection: 'row', gap: 16, width: '100%',
  },
  statBox: {
    flex: 1, backgroundColor: '#161B22', borderRadius: 16,
    padding: 20, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#21262D',
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#E6EDF3', fontFamily: 'JetBrainsMono' },
  statLabel: { fontSize: 11, color: '#8B949E', fontFamily: 'Inter' },

  // Already done
  doneHero: {
    width: '100%', borderRadius: 24, overflow: 'hidden',
    padding: 40, alignItems: 'center', gap: 12,
    borderWidth: 2, borderColor: 'rgba(35,134,54,0.5)',
    backgroundColor: '#161B22',
  },
  doneTitle: { fontSize: 24, fontWeight: '700', color: '#39FF14', fontFamily: 'Inter' },
  doneSub: { fontSize: 14, color: '#8B949E', fontFamily: 'Inter', textAlign: 'center' },
  practiceCard: {
    width: '100%', backgroundColor: '#161B22', borderRadius: 16,
    borderWidth: 1, borderColor: '#21262D', padding: 20, gap: 10, alignItems: 'center',
  },
  practiceTitle: { fontSize: 16, fontWeight: '600', color: '#E6EDF3', fontFamily: 'Inter' },
  practiceSub: { fontSize: 13, color: '#8B949E', fontFamily: 'Inter', textAlign: 'center' },
  practiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(88,166,255,0.1)', borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(88,166,255,0.3)',
    marginTop: 4,
  },
  practiceBtnText: { fontSize: 14, fontWeight: '600', color: '#58A6FF', fontFamily: 'Inter' },
  backButton3: {
    backgroundColor: '#21262D', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', width: '100%',
  },
  backButton3Text: { fontSize: 15, fontWeight: '600', color: '#8B949E', fontFamily: 'Inter' },

  // Error
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#E6EDF3', fontFamily: 'Inter' },
  errorSub: { fontSize: 14, color: '#8B949E', fontFamily: 'Inter', textAlign: 'center' },
  backButton2: {
    backgroundColor: '#21262D', borderRadius: 12,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  backButton2Text: { fontSize: 14, fontWeight: '600', color: '#E6EDF3', fontFamily: 'Inter' },
});
