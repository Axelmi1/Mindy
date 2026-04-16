/**
 * Admin Dashboard
 * Accessible uniquement en mode admin (bypass login).
 * Affiche les KPIs business : users, leçons, XP, streaks, events.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { analyticsApi } from '@/api/client';
import { API_BASE_URL } from '@/api/client';
import { Icon } from '@/components/ui/Icon';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  generatedAt: string;
  data: {
    users: {
      total: number;
      activeToday: number;
      activeThisWeek: number;
      newThisWeek: number;
      avgStreak: number;
      avgXp: number;
    };
    lessons: {
      totalCompletions: number;
      completionsToday: number;
      completionsThisWeek: number;
      topLessons: Array<{ id: string; title: string; domain: string; completions: number }>;
    };
    xp: {
      totalDistributed: number;
      distributedThisWeek: number;
      avgPerUser: number;
    };
    streaks: {
      freezesPurchased: number;
      usersWithStreakAtRisk: number;
    };
    events: {
      totalThisWeek: number;
      byType: Record<string, number>;
      byDay: Array<{ date: string; count: number }>;
    };
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.card, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidCardBg]} />
      )}
      <LinearGradient
        colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

function StatRow({
  icon,
  label,
  value,
  color = '#E6EDF3',
  sub,
}: {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statLabels}>
        <Text style={styles.statLabel}>{label}</Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function DomainPill({ domain }: { domain: string }) {
  const color = domain === 'CRYPTO' ? '#F7931A' : domain === 'FINANCE' ? '#39FF14' : '#00BFFF';
  return (
    <View style={[styles.domainPill, { borderColor: color + '40', backgroundColor: color + '15' }]}>
      <Text style={[styles.domainPillText, { color }]}>
        {domain === 'CRYPTO' ? '₿' : domain === 'FINANCE' ? '📈' : '⚡'} {domain}
      </Text>
    </View>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.miniBarBg}>
      <View style={[styles.miniBarFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
    </View>
  );
}

// ─── Retention Types ─────────────────────────────────────────────────────────

interface RetentionData {
  generatedAt: string;
  data: {
    dau: number;
    mau: number;
    dauMauRatio: number;
    d1Retention: number;
    d7Retention: number;
    d30Retention: number;
    dauTrend: Array<{ date: string; dau: number }>;
    avgSessionsPerUser: number;
    churnRate: number;
    newUsersLast7d: number;
    newUsersLast30d: number;
    avgLessonsPerDau: number;
  };
}

// ─── Retention Section ───────────────────────────────────────────────────────

function RetentionSection({ retention }: { retention: RetentionData }) {
  const d = retention.data;
  const dauMauPct = Math.round(d.dauMauRatio * 100);
  const maxTrend = d.dauTrend.reduce((m, v) => Math.max(m, v.dau), 1);

  const retentionColor = (pct: number) =>
    pct >= 40 ? '#39FF14' : pct >= 20 ? '#FFD700' : '#F85149';

  return (
    <>
      <SectionHeader title="Retention investisseurs" icon="📊" />

      {/* DAU / MAU stickiness */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={styles.retentionTitle}>Stickiness (DAU/MAU)</Text>
        <View style={styles.retentionKpiRow}>
          <View style={styles.retentionKpi}>
            <Text style={[styles.retentionKpiValue, { color: '#39FF14' }]}>{d.dau}</Text>
            <Text style={styles.retentionKpiLabel}>DAU</Text>
          </View>
          <View style={styles.retentionKpiDivider} />
          <View style={styles.retentionKpi}>
            <Text style={[styles.retentionKpiValue, { color: '#58A6FF' }]}>{d.mau}</Text>
            <Text style={styles.retentionKpiLabel}>MAU</Text>
          </View>
          <View style={styles.retentionKpiDivider} />
          <View style={styles.retentionKpi}>
            <Text style={[styles.retentionKpiValue, { color: dauMauPct >= 20 ? '#39FF14' : '#FFD700' }]}>
              {dauMauPct}%
            </Text>
            <Text style={styles.retentionKpiLabel}>Stickiness</Text>
          </View>
        </View>
        <View style={styles.retentionBarBg}>
          <View style={[styles.retentionBarFill, { width: `${Math.min(100, dauMauPct)}%` as any, backgroundColor: dauMauPct >= 20 ? '#39FF14' : '#FFD700' }]} />
        </View>
        <Text style={styles.retentionBarLabel}>
          Benchmark Duolingo : ~30% · WhatsApp : ~70%
        </Text>
      </GlassCard>

      {/* D1/D7/D30 cohort retention */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={styles.retentionTitle}>Rétention par cohorte</Text>
        {[
          { label: 'D1 (Jour 2)',  value: d.d1Retention,  bench: '25%+' },
          { label: 'D7 (Semaine)', value: d.d7Retention,  bench: '10%+' },
          { label: 'D30 (Mois)',   value: d.d30Retention, bench: '5%+'  },
        ].map(({ label, value, bench }) => (
          <View key={label} style={styles.cohortRow}>
            <Text style={styles.cohortLabel}>{label}</Text>
            <View style={styles.cohortBarBg}>
              <View
                style={[
                  styles.cohortBarFill,
                  { width: `${Math.min(100, value)}%` as any, backgroundColor: retentionColor(value) },
                ]}
              />
            </View>
            <Text style={[styles.cohortValue, { color: retentionColor(value) }]}>
              {value}%
            </Text>
            <Text style={styles.cohortBench}>{bench}</Text>
          </View>
        ))}
      </GlassCard>

      {/* Additional metrics */}
      <GlassCard style={{ marginBottom: 16 }}>
        <StatRow icon="📉" label="Churn rate (mensuel)" value={`${d.churnRate}%`}
          color={d.churnRate < 20 ? '#39FF14' : d.churnRate < 40 ? '#FFD700' : '#F85149'}
          sub={d.churnRate < 20 ? 'Excellent' : d.churnRate < 40 ? 'Acceptable' : 'Critique'} />
        <StatRow icon="📱" label="Sessions / DAU" value={d.avgSessionsPerUser} color="#58A6FF" />
        <StatRow icon="📚" label="Leçons / DAU" value={d.avgLessonsPerDau} color="#39FF14" />
        <StatRow icon="🆕" label="Nouveaux users (7j)" value={d.newUsersLast7d} color="#C9D1D9" />
        <StatRow icon="🆕" label="Nouveaux users (30j)" value={d.newUsersLast30d} color="#C9D1D9" />
      </GlassCard>

      {/* 30-day DAU trend */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Text style={styles.retentionTitle}>DAU trend (30 jours)</Text>
        <View style={styles.trendChart}>
          {d.dauTrend.map((point, i) => {
            const h = maxTrend > 0 ? Math.max(4, (point.dau / maxTrend) * 60) : 4;
            const isToday = i === d.dauTrend.length - 1;
            return (
              <View key={point.date} style={styles.trendBarWrapper}>
                <View
                  style={[
                    styles.trendBar,
                    { height: h, backgroundColor: isToday ? '#39FF14' : point.dau > 0 ? '#58A6FF' : '#21262D' },
                  ]}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.trendLabels}>
          <Text style={styles.trendLabel}>{d.dauTrend[0]?.date?.slice(5) ?? ''}</Text>
          <Text style={[styles.trendLabel, { color: '#39FF14' }]}>Aujourd'hui</Text>
        </View>
      </GlassCard>
    </>
  );
}

// ─── Funnel Types & Section ───────────────────────────────────────────────────

interface FunnelStep {
  step: number;
  label: string;
  icon: string;
  count: number;
  conversionFromPrevious: number | null;
  conversionFromTop: number;
}

interface FunnelData {
  generatedAt: string;
  totalSignups: number;
  overallConversion: number;
  steps: FunnelStep[];
  dropOffs: Array<{ fromStep: number; toStep: number; dropOff: number; dropOffPct: number }>;
}

const C_ADMIN = {
  bg: '#0D1117',
  surface: '#161B22',
  border: 'rgba(255,255,255,0.08)',
  primary: '#39FF14',
  text: '#E6EDF3',
  muted: '#8B949E',
  danger: '#F85149',
  gold: '#FFD700',
  cyan: '#00FFFF',
};

function FunnelSection({ funnel }: { funnel: FunnelData }) {
  const maxCount = funnel.steps[0]?.count ?? 1;

  const barColor = (convFromTop: number) => {
    if (convFromTop >= 70) return C_ADMIN.primary;
    if (convFromTop >= 40) return C_ADMIN.gold;
    if (convFromTop >= 15) return '#F97316';
    return C_ADMIN.danger;
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
      {/* Header card */}
      <View style={funnelStyles.headerCard}>
        <View>
          <Text style={funnelStyles.headerLabel}>Conversion globale</Text>
          <Text style={funnelStyles.headerValue}>{funnel.overallConversion}%</Text>
          <Text style={funnelStyles.headerSub}>
            {funnel.totalSignups} signups → {funnel.steps[funnel.steps.length - 1]?.count ?? 0} Pro
          </Text>
        </View>
        <View style={funnelStyles.funnelIcon}>
          <Text style={{ fontSize: 32 }}>🎯</Text>
        </View>
      </View>

      {/* Funnel steps */}
      <Text style={funnelStyles.sectionTitle}>Pipeline d'acquisition</Text>
      {funnel.steps.map((step, i) => {
        const barWidth = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
        const color = barColor(step.conversionFromTop);
        return (
          <View key={step.step} style={funnelStyles.stepRow}>
            {/* Step number + icon */}
            <View style={funnelStyles.stepLeft}>
              <Text style={funnelStyles.stepIcon}>{step.icon}</Text>
              <View>
                <Text style={funnelStyles.stepLabel}>{step.label}</Text>
                <Text style={funnelStyles.stepCount}>{step.count.toLocaleString()} users</Text>
              </View>
            </View>

            {/* Bar + conversion */}
            <View style={funnelStyles.stepRight}>
              <View style={funnelStyles.barBg}>
                <View style={[funnelStyles.barFill, { width: `${barWidth}%` as any, backgroundColor: color }]} />
              </View>
              <Text style={[funnelStyles.convPct, { color }]}>
                {step.conversionFromTop}%
              </Text>
            </View>

            {/* Drop-off arrow between steps */}
            {i < funnel.steps.length - 1 && funnel.dropOffs[i] && (
              <View style={funnelStyles.dropOffRow}>
                <Text style={funnelStyles.dropOffText}>
                  ↓ −{funnel.dropOffs[i].dropOff.toLocaleString()} ({funnel.dropOffs[i].dropOffPct}% drop)
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Overall conversion note */}
      <View style={funnelStyles.noteCard}>
        <Text style={funnelStyles.noteText}>
          💡 Benchmark SaaS éducation : onboarding {'>'} 70%, D7 {'>'} 40%, conversion Pro {'>'} 5%
        </Text>
      </View>
    </View>
  );
}

const funnelStyles = StyleSheet.create({
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${C_ADMIN.primary}44`,
  },
  headerLabel: { color: C_ADMIN.muted, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  headerValue: { color: C_ADMIN.primary, fontSize: 36, fontWeight: '900' },
  headerSub: { color: C_ADMIN.muted, fontSize: 12, marginTop: 4 },
  funnelIcon: { opacity: 0.8 },
  sectionTitle: { color: C_ADMIN.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  stepRow: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  stepLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  stepIcon: { fontSize: 20 },
  stepLabel: { color: C_ADMIN.text, fontSize: 13, fontWeight: '600' },
  stepCount: { color: C_ADMIN.muted, fontSize: 12, marginTop: 2 },
  stepRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
    minWidth: 4,
  },
  convPct: {
    width: 44,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
  },
  dropOffRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  dropOffText: {
    color: C_ADMIN.muted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  noteCard: {
    marginTop: 16,
    backgroundColor: 'rgba(57,255,20,0.06)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.2)',
    marginBottom: 8,
  },
  noteText: { color: C_ADMIN.primary, fontSize: 12, opacity: 0.8, lineHeight: 18 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [retention, setRetention] = useState<RetentionData | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'retention' | 'funnel'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const [dashRes, retentionRes, funnelRes] = await Promise.all([
        analyticsApi.getAdminDashboard(),
        analyticsApi.getRetentionMetrics().catch(() => null),
        analyticsApi.getFunnel().catch(() => null),
      ]);
      setData(dashRes as unknown as DashboardData);
      if (retentionRes) setRetention(retentionRes as unknown as RetentionData);
      if (funnelRes) setFunnel(funnelRes as unknown as FunnelData);
    } catch (e) {
      setError('Impossible de charger les stats. Vérifie que le serveur tourne.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const formatNum = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : String(n);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const maxBarValue =
    data?.data.events.byDay.reduce((m, d) => Math.max(m, d.count), 0) ?? 1;

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#E6EDF3" />
          </Pressable>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {[...Array(4)].map((_, i) => (
            <SkeletonBox key={i} width="100%" height={140} borderRadius={16} style={{ marginBottom: 16 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#E6EDF3" />
          </Pressable>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error ?? 'Erreur inconnue'}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { users, lessons, xp, streaks, events } = data.data;
  const generatedAt = new Date(data.generatedAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  });

  // ─── Main UI ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color="#E6EDF3" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>Actualisé à {generatedAt}</Text>
        </View>
        <LinearGradient colors={['#FF4444', '#CC0000']} style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </LinearGradient>
      </View>

      {/* Tab bar — Dashboard / Retention / Funnel */}
      <View style={styles.adminTabs}>
        {(['dashboard', 'retention', 'funnel'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.adminTab, activeTab === tab && styles.adminTabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.adminTabText, activeTab === tab && styles.adminTabTextActive]}>
              {tab === 'dashboard' ? '📈 Stats' : tab === 'retention' ? '🔁 Rétention' : '🎯 Funnel'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* CSV Export Button */}
      <Pressable
        style={styles.csvExportBtn}
        onPress={() => {
          const url = `${API_BASE_URL}/analytics/admin/export-csv`;
          Linking.openURL(url).catch(() => {
            Alert.alert('Erreur', 'Impossible d\'ouvrir l\'URL de téléchargement.');
          });
        }}
      >
        <Text style={styles.csvExportIcon}>📥</Text>
        <Text style={styles.csvExportText}>Exporter CSV (Excel / Investisseurs)</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#39FF14" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ─ TOP KPI STRIP ─ */}
        {activeTab === 'dashboard' && <Animated.View entering={FadeIn.duration(400)} style={styles.kpiStrip}>
          <LinearGradient
            colors={['#39FF1420', '#39FF1408', 'transparent']}
            style={styles.kpiStripGrad}
          >
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{formatNum(users.total)}</Text>
              <Text style={styles.kpiLabel}>Users</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiValue, { color: '#39FF14' }]}>{users.activeToday}</Text>
              <Text style={styles.kpiLabel}>Actifs auj.</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiValue, { color: '#FFD700' }]}>{formatNum(lessons.totalCompletions)}</Text>
              <Text style={styles.kpiLabel}>Leçons OK</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiValue, { color: '#00BFFF' }]}>{formatNum(xp.totalDistributed)}</Text>
              <Text style={styles.kpiLabel}>XP Total</Text>
            </View>
          </LinearGradient>
        </Animated.View>}

        {activeTab === 'dashboard' && <>
        {/* ─ USERS ─ */}
        <Animated.View entering={FadeInUp.delay(80).duration(400)}>
          <SectionHeader title="Utilisateurs" icon="👥" />
          <GlassCard>
            <StatRow icon="🌍" label="Total inscrits" value={formatNum(users.total)} color="#E6EDF3" />
            <View style={styles.divider} />
            <StatRow icon="⚡" label="Actifs aujourd'hui" value={users.activeToday} color="#39FF14" />
            <View style={styles.divider} />
            <StatRow icon="📅" label="Actifs cette semaine" value={users.activeThisWeek} color="#39FF14" sub="7 derniers jours" />
            <View style={styles.divider} />
            <StatRow icon="🆕" label="Nouveaux cette semaine" value={users.newThisWeek} color="#00BFFF" />
            <View style={styles.divider} />
            <StatRow icon="🔥" label="Streak moyen" value={`${users.avgStreak} j`} color="#FF6B35" />
            <View style={styles.divider} />
            <StatRow icon="⭐" label="XP moyen / user" value={formatNum(users.avgXp)} color="#FFD700" />
          </GlassCard>
        </Animated.View>

        {/* ─ LEÇONS ─ */}
        <Animated.View entering={FadeInUp.delay(160).duration(400)}>
          <SectionHeader title="Leçons" icon="📚" />
          <GlassCard>
            <StatRow icon="✅" label="Complétions totales" value={formatNum(lessons.totalCompletions)} color="#39FF14" />
            <View style={styles.divider} />
            <StatRow icon="📆" label="Aujourd'hui" value={lessons.completionsToday} color="#E6EDF3" />
            <View style={styles.divider} />
            <StatRow icon="📊" label="Cette semaine" value={lessons.completionsThisWeek} color="#E6EDF3" />
          </GlassCard>

          {/* Top lessons table */}
          {lessons.topLessons.length > 0 && (
            <GlassCard style={{ marginTop: 10 }}>
              <Text style={styles.subCardTitle}>🏆 Top leçons</Text>
              {lessons.topLessons.slice(0, 8).map((l, idx) => (
                <View key={l.id}>
                  {idx > 0 && <View style={styles.divider} />}
                  <View style={styles.topLessonRow}>
                    <Text style={styles.topLessonRank}>#{idx + 1}</Text>
                    <View style={styles.topLessonInfo}>
                      <Text style={styles.topLessonTitle} numberOfLines={1}>{l.title}</Text>
                      <DomainPill domain={l.domain} />
                    </View>
                    <Text style={styles.topLessonCount}>{l.completions}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          )}
        </Animated.View>

        {/* ─ XP & STREAKS ─ */}
        <Animated.View entering={FadeInUp.delay(240).duration(400)}>
          <SectionHeader title="XP & Streaks" icon="⚡" />
          <GlassCard>
            <StatRow icon="💰" label="XP distribués (total)" value={formatNum(xp.totalDistributed)} color="#FFD700" />
            <View style={styles.divider} />
            <StatRow icon="📈" label="XP cette semaine" value={formatNum(xp.distributedThisWeek)} color="#FFD700" sub="via LESSON_COMPLETED" />
            <View style={styles.divider} />
            <StatRow icon="🧊" label="Freezes achetés (7j)" value={streaks.freezesPurchased} color="#00BFFF" />
            <View style={styles.divider} />
            <StatRow icon="⚠️" label="Streaks à risque" value={streaks.usersWithStreakAtRisk} color="#FF6B6B" sub="actifs hier, pas aujourd'hui" />
          </GlassCard>
        </Animated.View>

        {/* ─ EVENTS PAR JOUR ─ */}
        <Animated.View entering={FadeInUp.delay(320).duration(400)}>
          <SectionHeader title="Activité (7 derniers jours)" icon="📉" />
          <GlassCard>
            <Text style={styles.subCardTitle}>Events totaux cette semaine : {formatNum(events.totalThisWeek)}</Text>
            <View style={styles.barChart}>
              {events.byDay.map((d, i) => (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barCount}>
                    {d.count >= 1000 ? `${(d.count / 1000).toFixed(1)}k` : String(d.count)}
                  </Text>
                  <MiniBar value={d.count} max={maxBarValue} color="#39FF14" />
                  <Text style={styles.barDate}>{formatDate(d.date)}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* ─ TOP EVENTS BY TYPE ─ */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <SectionHeader title="Top event types" icon="🎯" />
          <GlassCard>
            {Object.entries(events.byType)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([type, count], i) => (
                <View key={type}>
                  {i > 0 && <View style={styles.divider} />}
                  <StatRow
                    icon="▶"
                    label={type.replace(/_/g, ' ')}
                    value={count}
                    color={i === 0 ? '#39FF14' : '#8B949E'}
                  />
                </View>
              ))}
          </GlassCard>
        </Animated.View>

        </>}

        {/* Retention Tab — shown when activeTab === 'retention' */}
        {activeTab === 'retention' && retention && (
          <Animated.View entering={FadeInUp.duration(300)}>
            <RetentionSection retention={retention} />
          </Animated.View>
        )}
        {activeTab === 'retention' && !retention && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: '#8B949E', fontFamily: 'Inter', fontSize: 14 }}>
              Données de rétention indisponibles.{'\n'}Assure-toi que le backend est à jour.
            </Text>
          </View>
        )}

        {/* Funnel Tab */}
        {activeTab === 'funnel' && funnel && (
          <Animated.View entering={FadeInUp.duration(300)}>
            <FunnelSection funnel={funnel} />
          </Animated.View>
        )}
        {activeTab === 'funnel' && !funnel && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: '#8B949E', fontFamily: 'Inter', fontSize: 14 }}>
              Données funnel indisponibles.{'\n'}Assure-toi que le backend est à jour.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Vue réservée aux admins · Mindy v1.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#161B22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'JetBrainsMono',
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#6E7681',
    marginTop: 1,
  },
  adminBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#CC0000',
  },
  adminBadgeText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 48,
  },
  // KPI strip
  kpiStrip: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#39FF1430',
  },
  kpiStripGrad: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 22,
    fontWeight: '700',
    color: '#E6EDF3',
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    marginTop: 3,
  },
  kpiDivider: {
    width: 1,
    backgroundColor: '#30363D',
    marginVertical: 4,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#8B949E',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Card
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#30363D',
    marginBottom: 8,
  },
  androidCardBg: {
    backgroundColor: '#161B22',
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  // Stat row
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  statIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  statLabels: {
    flex: 1,
  },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#C9D1D9',
  },
  statSub: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#6E7681',
    marginTop: 1,
  },
  statValue: {
    fontFamily: 'JetBrainsMono',
    fontSize: 16,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  divider: {
    height: 1,
    backgroundColor: '#21262D',
    marginHorizontal: 0,
  },
  // Sub card
  subCardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#8B949E',
    marginBottom: 12,
  },
  // Top lessons
  topLessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  topLessonRank: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#6E7681',
    width: 24,
  },
  topLessonInfo: {
    flex: 1,
    gap: 4,
  },
  topLessonTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#C9D1D9',
  },
  topLessonCount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    fontWeight: '700',
    color: '#39FF14',
  },
  // Domain pill
  domainPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  domainPillText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    fontWeight: '600',
  },
  // Bar chart
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barCount: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#8B949E',
  },
  barDate: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#6E7681',
  },
  miniBarBg: {
    width: '100%',
    height: 60,
    backgroundColor: '#21262D',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  miniBarFill: {
    borderRadius: 4,
  },
  // Footer
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#6E7681',
  },
  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: '#39FF14',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0D1117',
  },
  // ── Admin Tabs ──────────────────────────────────────────────────────────
  adminTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 4,
  },
  adminTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  adminTabActive: {
    backgroundColor: '#21262D',
  },
  adminTabText: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#8B949E',
    fontWeight: '500',
  },
  adminTabTextActive: {
    color: '#39FF14',
    fontWeight: '700',
  },
  csvExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(57,255,20,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(57,255,20,0.3)',
  },
  csvExportIcon: {
    fontSize: 16,
  },
  csvExportText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#39FF14',
  },
  // ── Retention styles ────────────────────────────────────────────────────
  retentionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E6EDF3',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  retentionKpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  retentionKpi: {
    flex: 1,
    alignItems: 'center',
  },
  retentionKpiValue: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'JetBrainsMono',
  },
  retentionKpiLabel: {
    fontSize: 11,
    color: '#8B949E',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  retentionKpiDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#30363D',
  },
  retentionBarBg: {
    height: 6,
    backgroundColor: '#21262D',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  retentionBarFill: {
    height: 6,
    borderRadius: 3,
  },
  retentionBarLabel: {
    fontSize: 10,
    color: '#6E7681',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  cohortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cohortLabel: {
    width: 90,
    fontSize: 12,
    color: '#8B949E',
    fontFamily: 'Inter',
  },
  cohortBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#21262D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  cohortBarFill: {
    height: 8,
    borderRadius: 4,
  },
  cohortValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 13,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
  },
  cohortBench: {
    width: 40,
    textAlign: 'right',
    fontSize: 10,
    color: '#6E7681',
    fontFamily: 'Inter',
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 64,
    gap: 2,
    marginBottom: 8,
  },
  trendBarWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  trendBar: {
    borderRadius: 2,
    minHeight: 2,
  },
  trendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendLabel: {
    fontSize: 10,
    color: '#6E7681',
    fontFamily: 'Inter',
  },
});
