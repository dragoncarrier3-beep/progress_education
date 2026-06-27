import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './lib/auth';
import { getGrades, getGradeAnalytics, Grade, SubjectStat } from './lib/data';
import { colors, shadow } from './lib/theme';
import Header from './components/Header';
import { Skeleton, EmptyState, Card } from './components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [grade, setGrade] = useState<number | null>(null);
  const [stats, setStats] = useState<SubjectStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const g = await getGrades();
      setGrades(g);
      if (g.length) setGrade(g[0].level);
      if (!g.length) setLoading(false);
    })();
  }, []);

  const load = useCallback(async (lvl: number) => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const st = await getGradeAnalytics(user.id, lvl);
    setStats(st);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { if (grade != null) load(grade); }, [grade, load]);

  const totals = stats.reduce((a, s) => ({ total: a.total + s.total, known: a.known + s.known, kinda: a.kinda + s.kinda }), { total: 0, known: 0, kinda: 0 });
  const overall = totals.total ? Math.round((totals.known / totals.total) * 100) : 0;
  const tracked = stats.filter(s => s.total > 0);
  const weak = [...tracked].sort((a, b) => (a.known / Math.max(a.total, 1)) - (b.known / Math.max(b.total, 1)))[0];
  const strong = [...tracked].sort((a, b) => (b.known / Math.max(b.total, 1)) - (a.known / Math.max(a.total, 1)))[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="My Progress" subtitle="Your learning dashboard" back />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {grades.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }} contentContainerStyle={{ gap: 8 }}>
            {grades.map(g => (
              <Pressable key={g.id} onPress={() => setGrade(g.level)} style={[s.chip, grade === g.level && s.chipActive]}>
                <Text style={[s.chipText, grade === g.level && s.chipTextActive]}>{g.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {loading ? (
          <Skeleton count={5} height={90} />
        ) : grades.length === 0 ? (
          <EmptyState icon="stats-chart-outline" title="No data to show" subtitle="Start tracking items to see your progress." />
        ) : (
          <>
            <Card style={{ marginBottom: 16 }}>
              <Text style={s.bigPct}>{overall}%</Text>
              <Text style={s.bigLabel}>Overall completion · Grade {grade}</Text>
              <View style={s.bar}>
                <View style={[s.barFill, { width: `${overall}%`, backgroundColor: colors.know }]} />
              </View>
              <View style={s.legendRow}>
                <Legend color={colors.know} label={`${totals.known} known`} />
                <Legend color={colors.kinda} label={`${totals.kinda} learning`} />
                <Legend color={colors.border} label={`${totals.total - totals.known - totals.kinda} to do`} />
              </View>
            </Card>

            {tracked.length > 0 && (
              <View style={s.badgeRow}>
                {strong && strong.known > 0 && (
                  <View style={[s.badge, { backgroundColor: colors.knowBg }]}>
                    <Ionicons name="trophy" size={16} color={colors.know} />
                    <Text style={[s.badgeText, { color: colors.know }]}>Strongest: {strong.subject.name}</Text>
                  </View>
                )}
                {weak && (
                  <View style={[s.badge, { backgroundColor: colors.dontBg }]}>
                    <Ionicons name="barbell" size={16} color={colors.dont} />
                    <Text style={[s.badgeText, { color: colors.dont }]}>Focus: {weak.subject.name}</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={s.section}>By subject</Text>
            {stats.map(st => {
              const p = st.total ? Math.round((st.known / st.total) * 100) : 0;
              return (
                <Card key={st.subject.id} style={{ marginBottom: 12 }}>
                  <View style={s.subjRow}>
                    <Text style={s.subjName}>{st.subject.name}</Text>
                    <Text style={[s.subjPct, { color: st.total ? colors.primary : colors.muted }]}>{st.total ? `${p}%` : 'No items'}</Text>
                  </View>
                  <View style={s.bar}>
                    <View style={[s.barFill, { width: `${p}%`, backgroundColor: st.subject.color || colors.primary }]} />
                  </View>
                  <Text style={s.subjMeta}>{st.known} known · {st.kinda} learning · {st.dont} to learn · {st.total} total</Text>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  bigPct: { fontSize: 44, fontWeight: '900', color: colors.primary },
  bigLabel: { color: colors.muted, fontWeight: '600', marginBottom: 12 },
  bar: { height: 10, borderRadius: 6, backgroundColor: '#EDF1F7', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 18, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  badgeText: { fontWeight: '700', fontSize: 13 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 },
  subjRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  subjName: { fontSize: 16, fontWeight: '700', color: colors.text },
  subjPct: { fontSize: 16, fontWeight: '800' },
  subjMeta: { color: colors.muted, fontSize: 12, marginTop: 8 },
});
