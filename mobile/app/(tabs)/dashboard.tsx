import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchDashboard } from '@/lib/api';
import { Colors } from '@/lib/constants';
import { DashboardSummary } from '@/lib/types';
import { BodyGrid } from '@/components/BodyGrid';
import { NutrientGapCard } from '@/components/NutrientGapCard';
import { SpendingBreakdown } from '@/components/SpendingBreakdown';
import { WeeklyTrend } from '@/components/WeeklyTrend';

const PERIODS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '3 months', days: 90 },
];

export default function DashboardScreen() {
  const [period, setPeriod] = useState(30);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (days: number) => {
    setError(null);
    try {
      const data = await fetchDashboard(days);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Couldn\'t load your report — check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(period);
    setRefreshing(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const scoreColor = (score: number) =>
    score >= 70 ? Colors.green : score >= 40 ? Colors.amber : Colors.red;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={Colors.green} />
        <Text style={styles.loadingText}>Loading your report…</Text>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.emptyTitle}>Couldn't load report</Text>
        <Text style={styles.emptyText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => { setLoading(true); load(period); }}>
          <Text style={styles.retryBtnText}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (!summary || summary.total_receipts === 0) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>No receipts yet</Text>
        <Text style={styles.emptyText}>Upload your first grocery receipt to see your food report.</Text>
        <Pressable style={styles.addBtn} onPress={() => router.navigate('/')}>
          <Text style={styles.addBtnText}>+ Upload a receipt</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { health_report } = summary;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />}
      >
        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <Pressable
              key={p.days}
              style={[styles.periodBtn, p.days === period && styles.periodBtnActive]}
              onPress={() => { setLoading(true); setPeriod(p.days); }}
            >
              <Text style={[styles.periodBtnText, p.days === period && styles.periodBtnTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${summary.total_spent.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.total_receipts}</Text>
            <Text style={styles.statLabel}>Receipts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: scoreColor(health_report.overall_score) }]}>
              {health_report.overall_score}%
            </Text>
            <Text style={styles.statLabel}>Health score</Text>
          </View>
        </View>

        {/* Health report */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>HEALTH COVERAGE  <Text style={styles.cardTitleNote}>last 14 days</Text></Text>

          {/* Score + message */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreCircleWrap}>
              <Text style={[styles.scoreBig, { color: scoreColor(health_report.overall_score) }]}>
                {health_report.overall_score}%
              </Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreMessage}>{health_report.summary_message}</Text>
              <Text style={styles.scoreSub}>
                {health_report.body_systems.filter(s => s.status === 'good').length} areas well covered ·{' '}
                {health_report.body_systems.filter(s => s.status === 'partial').length} partial ·{' '}
                {health_report.body_systems.filter(s => s.status === 'missing').length} missing
              </Text>
            </View>
          </View>

          <BodyGrid systems={health_report.body_systems} />
        </View>

        {/* Spending breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>WHERE YOUR MONEY GOES</Text>
          <SpendingBreakdown groups={summary.spending_by_group} />
        </View>

        {/* Weekly trend */}
        {summary.weekly_trend.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>WEEKLY SPENDING</Text>
            <WeeklyTrend weeks={summary.weekly_trend} />
          </View>
        )}

        {/* Nutrient gaps */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What your body is missing</Text>
            {health_report.nutrient_gaps.length > 0 && (
              <Text style={styles.sectionCount}>{health_report.nutrient_gaps.length} missing</Text>
            )}
          </View>

          {health_report.nutrient_gaps.length === 0 ? (
            <View style={[styles.card, styles.allGoodCard]}>
              <Text style={styles.allGoodIcon}>🎉</Text>
              <Text style={styles.allGoodTitle}>All health areas covered!</Text>
              <Text style={styles.allGoodText}>Great variety in your recent shop.</Text>
            </View>
          ) : (
            health_report.nutrient_gaps.map(g => (
              <NutrientGapCard key={g.nutrient} gap={g} />
            ))
          )}
        </View>

        {/* Recent receipts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent receipts</Text>
          <View style={styles.card}>
            {summary.recent_receipts.map((r, i) => (
              <View
                key={r.id}
                style={[styles.receiptRow, i < summary.recent_receipts.length - 1 && styles.receiptRowBorder]}
              >
                <View style={styles.receiptThumb}><Text style={{ fontSize: 18 }}>🧾</Text></View>
                <View style={styles.receiptInfo}>
                  <Text style={styles.receiptStore}>{r.store_name || 'Grocery shop'}</Text>
                  <Text style={styles.receiptDate}>{formatDate(r.purchased_at)}</Text>
                </View>
                <Text style={styles.receiptAmount}>
                  {r.total_amount ? `$${parseFloat(String(r.total_amount)).toFixed(2)}` : '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { padding: 16 },

  loadingText: { marginTop: 12, fontSize: 15, color: Colors.textSecondary },

  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  retryBtn: { backgroundColor: Colors.greenLight, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  retryBtnText: { fontSize: 15, fontWeight: '600', color: Colors.green },

  addBtn: { backgroundColor: Colors.green, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  periodRow: {
    flexDirection: 'row', backgroundColor: Colors.borderSubtle,
    borderRadius: 12, padding: 4, marginBottom: 20, gap: 4,
  },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  periodBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  periodBtnText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  periodBtnTextActive: { color: Colors.text, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14, alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.6, marginBottom: 14 },
  cardTitleNote: { fontSize: 10, fontWeight: '400', color: Colors.textMuted },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  scoreCircleWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  scoreBig: { fontSize: 18, fontWeight: '800' },
  scoreInfo: { flex: 1 },
  scoreMessage: { fontSize: 14, fontWeight: '500', color: Colors.text, lineHeight: 20 },
  scoreSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },

  section: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sectionCount: { fontSize: 13, color: Colors.textSecondary },

  allGoodCard: { alignItems: 'center', paddingVertical: 32 },
  allGoodIcon: { fontSize: 36, marginBottom: 12 },
  allGoodTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  allGoodText: { fontSize: 14, color: Colors.textSecondary },

  receiptRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  receiptRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  receiptThumb: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: Colors.borderSubtle,
    alignItems: 'center', justifyContent: 'center',
  },
  receiptInfo: { flex: 1 },
  receiptStore: { fontSize: 14, fontWeight: '600', color: Colors.text },
  receiptDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  receiptAmount: { fontSize: 14, fontWeight: '700', color: Colors.text },
});
