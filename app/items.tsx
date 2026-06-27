import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from './lib/auth';
import { useSync } from './lib/offline';
import { getItems, getProgressForItems, Item, ProgressMap } from './lib/data';
import { colors, StatusKey } from './lib/theme';
import Header from './components/Header';
import { Skeleton, EmptyState, Card } from './components/ui';
import ProgressButtons from './components/ProgressButtons';

const PAGE = 50;

export default function Items() {
  const { topicId, topicName } = useLocalSearchParams<{ topicId: string; topicName: string }>();
  const tid = Number(topicId) || 0;
  const { user } = useAuth();
  const { enqueue } = useSync();
  const [items, setItems] = useState<Item[]>([]);
  const [progress, setProgressMap] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(async (from: number, append: boolean) => {
    const batch = await getItems(tid, from, PAGE);
    if (batch.length < PAGE) setHasMore(false);
    if (user?.id && batch.length) {
      const pm = await getProgressForItems(user.id, batch.map(b => b.id));
      setProgressMap(prev => ({ ...prev, ...pm }));
    }
    setItems(prev => (append ? [...prev, ...batch] : batch));
  }, [tid, user?.id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setHasMore(true);
      await fetchPage(0, false);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tid, user?.id]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    await fetchPage(items.length, true);
    setLoadingMore(false);
  };

  const onChange = (item: Item, status: StatusKey) => {
    // optimistic UI update — feels instant
    setProgressMap(p => ({ ...p, [item.id]: status }));
    if (!user?.id) return;
    // queue the change; the sync engine persists locally + flushes when online
    enqueue(user.id, item.id, status);
  };

  const known = items.filter(i => progress[i.id] === 'know').length;
  const pct = items.length ? Math.round((known / items.length) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title={topicName || 'Learning items'} subtitle={loading ? 'Loading…' : `${known}/${items.length} known • ${pct}%`} back />

      {loading ? (
        <Skeleton count={5} height={120} />
      ) : items.length === 0 ? (
        <EmptyState icon="bulb-outline" title="No learning items yet" subtitle="This topic has no items added. Try another topic." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          renderItem={({ item }) => (
            <Card>
              <Text style={s.content}>{item.content}</Text>
              {item.hint ? (
                <View style={s.hintRow}>
                  <Ionicons name="information-circle-outline" size={15} color={colors.muted} />
                  <Text style={s.hint}>{item.hint}</Text>
                </View>
              ) : null}
              <ProgressButtons value={progress[item.id]} onChange={(st) => onChange(item, st)} />
            </Card>
          )}
          ListFooterComponent={
            loadingMore ? <Text style={s.footer}>Loading more…</Text> :
            !hasMore && items.length > PAGE ? <Text style={s.footer}>That's everything!</Text> : null
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  content: { fontSize: 17, fontWeight: '700', color: colors.text },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  hint: { color: colors.muted, fontSize: 13, fontStyle: 'italic', flex: 1 },
  footer: { textAlign: 'center', color: colors.muted, paddingVertical: 18 },
});
