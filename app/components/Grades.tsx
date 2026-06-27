import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth';
import { getGrades, Grade } from '../lib/data';
import { colors, shadow } from '../lib/theme';
import Header from './Header';
import { Skeleton, EmptyState } from './ui';

export default function Grades() {
  const router = useRouter();
  const { user, isAdmin, signOut } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    const g = await getGrades();
    setGrades(g);
    if (g.length === 0) setFailed(true);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const greeting = (user?.email || 'Student').split('@')[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header
        title="StudyTrack"
        subtitle={`Hi, ${greeting} 👋`}
        right={
          <Pressable hitSlop={10} onPress={signOut} style={s.iconBtn}>
            <Ionicons name="log-out-outline" size={20} color={colors.white} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={s.quickRow}>
          <Pressable style={[s.quick, shadow]} onPress={() => router.push('/dashboard')}>
            <View style={[s.quickIcon, { backgroundColor: '#EAF1FE' }]}><Ionicons name="stats-chart" size={22} color={colors.primary} /></View>
            <Text style={s.quickText}>My Progress</Text>
          </Pressable>
          <Pressable style={[s.quick, shadow]} onPress={() => router.push('/admin')}>
            <View style={[s.quickIcon, { backgroundColor: '#FEF3C7' }]}><Ionicons name="construct" size={22} color={colors.kinda} /></View>
            <Text style={s.quickText}>{isAdmin ? 'Admin CMS' : 'Become Admin'}</Text>
          </Pressable>
        </View>

        <Text style={s.section}>Choose your grade</Text>

        {loading ? (
          <Skeleton count={5} height={64} />
        ) : failed ? (
          <EmptyState icon="cloud-offline-outline" title="No grades loaded" subtitle="We couldn't reach the content right now." onRetry={load} />
        ) : (
          <View style={s.grid}>
            {grades.map((g) => (
              <Pressable
                key={g.id}
                style={[s.gradeCard, shadow]}
                onPress={() => router.push({ pathname: '/subjects', params: { grade: String(g.level), label: g.label } })}
              >
                <Text style={s.gradeNum}>{g.level}</Text>
                <Text style={s.gradeLabel}>{g.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} style={{ position: 'absolute', right: 12, top: 12 }} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  quick: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border },
  quickIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontWeight: '700', color: colors.text, fontSize: 14 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gradeCard: { width: '47.5%', backgroundColor: colors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.border },
  gradeNum: { fontSize: 34, fontWeight: '900', color: colors.primary },
  gradeLabel: { fontSize: 14, color: colors.muted, fontWeight: '600', marginTop: 2 },
});
