import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSubjects, Subject } from './lib/data';
import { colors, shadow } from './lib/theme';
import Header from './components/Header';
import { Skeleton, EmptyState } from './components/ui';

export default function Subjects() {
  const router = useRouter();
  const { grade, label } = useLocalSearchParams<{ grade: string; label: string }>();
  const gradeNum = Number(grade) || 0;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const s = await getSubjects();
    setSubjects(s);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={label || `Grade ${grade}`} subtitle="Pick a subject" back />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {loading ? (
          <Skeleton count={6} height={72} />
        ) : subjects.length === 0 ? (
          <EmptyState icon="library-outline" title="No subjects yet" subtitle="Check back soon — content is being added." onRetry={load} />
        ) : (
          <View style={s.grid}>
            {subjects.map((sub) => (
              <Pressable
                key={sub.id}
                style={[s.card, shadow]}
                onPress={() => router.push({ pathname: '/topics', params: { grade: String(gradeNum), subjectId: String(sub.id), subjectName: sub.name } })}
              >
                <View style={[s.icon, { backgroundColor: (sub.color || colors.primary) + '22' }]}>
                  <Ionicons name={mapIcon(sub.icon)} size={26} color={sub.color || colors.primary} />
                </View>
                <Text style={s.name}>{sub.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function mapIcon(name?: string): any {
  const allowed = ['calculator', 'book-open', 'language', 'leaf', 'flash', 'flask', 'time', 'earth', 'school'];
  if (name && allowed.includes(name)) {
    return name === 'book-open' ? 'book' : name;
  }
  return 'book';
}

const s = StyleSheet.create({
  grid: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  icon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text },
});
