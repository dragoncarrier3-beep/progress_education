import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getTopics, Topic } from './lib/data';
import { colors, shadow } from './lib/theme';
import Header from './components/Header';
import { Skeleton, EmptyState } from './components/ui';

export default function Topics() {
  const router = useRouter();
  const { grade, subjectId, subjectName } = useLocalSearchParams<{ grade: string; subjectId: string; subjectName: string }>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const t = await getTopics(Number(grade) || 0, Number(subjectId) || 0);
    setTopics(t);
    setLoading(false);
    setRefreshing(false);
  }, [grade, subjectId]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={subjectName || 'Topics'} subtitle={`Grade ${grade}`} back />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {loading ? (
          <Skeleton count={5} height={64} />
        ) : topics.length === 0 ? (
          <EmptyState icon="documents-outline" title="No topics here yet" subtitle={`${subjectName} for Grade ${grade} is coming soon.`} onRetry={load} />
        ) : (
          <View style={{ gap: 12 }}>
            {topics.map((t, idx) => (
              <Pressable
                key={t.id}
                style={[s.card, shadow]}
                onPress={() => router.push({ pathname: '/items', params: { topicId: String(t.id), topicName: t.name } })}
              >
                <View style={s.num}><Text style={s.numText}>{idx + 1}</Text></View>
                <Text style={s.name}>{t.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  num: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  numText: { color: colors.primary, fontWeight: '800' },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
});
