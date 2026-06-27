import { isDemoMode } from './config';
import {
  demoGetGrades,
  demoGetSubjects,
  demoGetTopics,
  demoGetItems,
  demoGetProgressForItems,
  demoSetProgress,
  demoGetGradeAnalytics,
} from './demo-store';
import { supabase } from './supabase';
import type { StatusKey } from './theme';
import { getJSON, setJSON, CACHE_KEYS } from './storage';

// All fetchers are crash-proof AND offline-first:
// 1. Try network. 2. On success, cache the result. 3. On failure, fall back to cache.

export type Grade = { id: number; level: number; label: string };
export type Subject = { id: number; name: string; icon: string; color: string; sort_order: number };
export type Topic = { id: number; grade_level: number; subject_id: number; name: string; sort_order: number };
export type Item = { id: number; topic_id: number; content: string; hint: string | null; sort_order: number };

async function tryFetch<T>(p: Promise<{ data: T | null; error: any }>): Promise<{ data: T | null; ok: boolean }> {
  try {
    const { data, error } = await p;
    if (error) return { data: null, ok: false };
    return { data, ok: true };
  } catch {
    return { data: null, ok: false };
  }
}

export async function getGrades(): Promise<Grade[]> {
  if (isDemoMode) {
    const data = await demoGetGrades();
    await setJSON(CACHE_KEYS.grades, data);
    return data;
  }
  const { data, ok } = await tryFetch<Grade[]>(
    supabase.from('grades').select('*').order('level') as any
  );
  if (ok && data) { await setJSON(CACHE_KEYS.grades, data); return data; }
  return getJSON<Grade[]>(CACHE_KEYS.grades, []);
}

export async function getSubjects(): Promise<Subject[]> {
  if (isDemoMode) {
    const data = await demoGetSubjects();
    await setJSON(CACHE_KEYS.subjects, data);
    return data;
  }
  const { data, ok } = await tryFetch<Subject[]>(
    supabase.from('subjects').select('*').order('sort_order') as any
  );
  if (ok && data) { await setJSON(CACHE_KEYS.subjects, data); return data; }
  return getJSON<Subject[]>(CACHE_KEYS.subjects, []);
}

export async function getTopics(grade: number, subjectId: number): Promise<Topic[]> {
  if (isDemoMode) {
    const data = await demoGetTopics(grade, subjectId);
    await setJSON(CACHE_KEYS.topics(grade, subjectId), data);
    return data;
  }
  const { data, ok } = await tryFetch<Topic[]>(
    supabase.from('topics').select('*').eq('grade_level', grade).eq('subject_id', subjectId).order('sort_order') as any
  );
  if (ok && data) { await setJSON(CACHE_KEYS.topics(grade, subjectId), data); return data; }
  return getJSON<Topic[]>(CACHE_KEYS.topics(grade, subjectId), []);
}

export async function getItems(topicId: number, from = 0, limit = 50): Promise<Item[]> {
  if (isDemoMode) return demoGetItems(topicId, from, limit);
  const { data, ok } = await tryFetch<Item[]>(
    supabase.from('learning_items').select('*').eq('topic_id', topicId).order('sort_order').range(from, from + limit - 1) as any
  );
  if (ok && data) {
    if (from === 0) await setJSON(CACHE_KEYS.items(topicId), data);
    return data;
  }
  if (from === 0) return getJSON<Item[]>(CACHE_KEYS.items(topicId), []);
  return [];
}

export type ProgressMap = Record<number, StatusKey>;

async function overlayQueue(userId: string, base: ProgressMap): Promise<ProgressMap> {
  try {
    const queue = await getJSON<QueueItem[]>(CACHE_KEYS.queue, []);
    const merged = { ...base };
    for (const q of queue) {
      if (q.userId === userId) merged[q.itemId] = q.status;
    }
    return merged;
  } catch {
    return base;
  }
}

export type QueueItem = { userId: string; itemId: number; status: StatusKey; ts: number };

export async function getProgressForItems(userId: string, itemIds: number[]): Promise<ProgressMap> {
  if (!userId || itemIds.length === 0) return {};
  if (isDemoMode) {
    const base = await demoGetProgressForItems(userId, itemIds);
    return overlayQueue(userId, base);
  }
  let base: ProgressMap = {};
  try {
    const { data, error } = await supabase.from('progress').select('item_id,status').in('item_id', itemIds).eq('user_id', userId);
    if (!error && data) {
      for (const r of data as any[]) {
        if (r && r.item_id != null && (r.status === 'know' || r.status === 'kinda' || r.status === 'dont')) {
          base[r.item_id] = r.status;
        }
      }
      const cached = await getJSON<ProgressMap>(CACHE_KEYS.progress(userId), {});
      await setJSON(CACHE_KEYS.progress(userId), { ...cached, ...base });
    } else {
      const cached = await getJSON<ProgressMap>(CACHE_KEYS.progress(userId), {});
      for (const id of itemIds) if (cached[id]) base[id] = cached[id];
    }
  } catch {
    const cached = await getJSON<ProgressMap>(CACHE_KEYS.progress(userId), {});
    for (const id of itemIds) if (cached[id]) base[id] = cached[id];
  }
  return overlayQueue(userId, base);
}

export async function setProgress(userId: string, itemId: number, status: StatusKey): Promise<boolean> {
  if (!userId) return false;
  if (isDemoMode) {
    const ok = await demoSetProgress(userId, itemId, status);
    if (ok) {
      const cached = await getJSON<ProgressMap>(CACHE_KEYS.progress(userId), {});
      cached[itemId] = status;
      await setJSON(CACHE_KEYS.progress(userId), cached);
    }
    return ok;
  }
  try {
    const { error } = await supabase
      .from('progress')
      .upsert({ user_id: userId, item_id: itemId, status, updated_at: new Date().toISOString() }, { onConflict: 'user_id,item_id' });
    if (!error) {
      const cached = await getJSON<ProgressMap>(CACHE_KEYS.progress(userId), {});
      cached[itemId] = status;
      await setJSON(CACHE_KEYS.progress(userId), cached);
    }
    return !error;
  } catch { return false; }
}

export type SubjectStat = { subject: Subject; total: number; known: number; kinda: number; dont: number };

export async function getGradeAnalytics(userId: string, grade: number): Promise<SubjectStat[]> {
  if (isDemoMode) return demoGetGradeAnalytics(userId, grade);
  const subjects = await getSubjects();
  if (subjects.length === 0) return [];
  const tf = await tryFetch<{ id: number; subject_id: number }[]>(
    supabase.from('topics').select('id,subject_id').eq('grade_level', grade) as any
  );
  const topics = tf.ok && tf.data ? tf.data : [];
  if (topics.length === 0) return subjects.map(s => ({ subject: s, total: 0, known: 0, kinda: 0, dont: 0 }));
  const topicIds = topics.map(t => t.id);
  const itf = await tryFetch<{ id: number; topic_id: number }[]>(
    supabase.from('learning_items').select('id,topic_id').in('topic_id', topicIds) as any
  );
  const items = itf.ok && itf.data ? itf.data : [];
  const progress = await getProgressForItems(userId, items.map(i => i.id));

  const topicToSubject: Record<number, number> = {};
  topics.forEach(t => { topicToSubject[t.id] = t.subject_id; });

  const stats: Record<number, SubjectStat> = {};
  subjects.forEach(s => { stats[s.id] = { subject: s, total: 0, known: 0, kinda: 0, dont: 0 }; });

  items.forEach(it => {
    const sid = topicToSubject[it.topic_id];
    const st = stats[sid];
    if (!st) return;
    st.total++;
    const p = progress[it.id];
    if (p === 'know') st.known++;
    else if (p === 'kinda') st.kinda++;
    else if (p === 'dont') st.dont++;
  });
  return subjects.map(s => stats[s.id]);
}
