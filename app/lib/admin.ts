import { isDemoMode } from './config';
import {
  demoAddSubject,
  demoAddTopic,
  demoAddItem,
  demoGetTopicsForSubject,
  demoBulkImport,
} from './demo-store';
import { supabase } from './supabase';

export async function addSubject(name: string, color = '#3B82F6'): Promise<string | null> {
  if (isDemoMode) return demoAddSubject(name, color);
  if (!name.trim()) return 'Name required';
  try {
    const { error } = await supabase.from('subjects').insert({ name: name.trim(), color, icon: 'book' });
    return error ? error.message : null;
  } catch (e: any) { return e?.message || 'Failed'; }
}

export async function addTopic(grade: number, subjectId: number, name: string): Promise<string | null> {
  if (isDemoMode) return demoAddTopic(grade, subjectId, name);
  if (!name.trim()) return 'Name required';
  if (!grade || !subjectId) return 'Grade & subject required';
  try {
    const { error } = await supabase.from('topics').insert({ grade_level: grade, subject_id: subjectId, name: name.trim() });
    return error ? error.message : null;
  } catch (e: any) { return e?.message || 'Failed'; }
}

export async function addItem(topicId: number, content: string, hint?: string): Promise<string | null> {
  if (isDemoMode) return demoAddItem(topicId, content, hint);
  if (!content.trim()) return 'Content required';
  if (!topicId) return 'Topic required';
  try {
    const { error } = await supabase.from('learning_items').insert({ topic_id: topicId, content: content.trim(), hint: hint?.trim() || null });
    return error ? error.message : null;
  } catch (e: any) { return e?.message || 'Failed'; }
}

export async function getTopicsForSubject(grade: number, subjectId: number) {
  if (isDemoMode) return demoGetTopicsForSubject(grade, subjectId);
  try {
    const { data } = await supabase.from('topics').select('id,name').eq('grade_level', grade).eq('subject_id', subjectId).order('sort_order');
    return data || [];
  } catch { return []; }
}

type BulkRow = { grade: number | string; subject: string; topic: string; content: string; hint?: string };

export type BulkResult = { inserted: number; skipped: number; errors: string[] };

export async function bulkImport(raw: string): Promise<BulkResult> {
  if (isDemoMode) return demoBulkImport(raw);
  const res: BulkResult = { inserted: 0, skipped: 0, errors: [] };
  let rows: BulkRow[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { res.errors.push('JSON must be an array of rows.'); return res; }
    rows = parsed;
  } catch {
    res.errors.push('Invalid JSON. Please check the format.');
    return res;
  }

  const subjectCache: Record<string, number> = {};
  const topicCache: Record<string, number> = {};

  try {
    const { data: subs } = await supabase.from('subjects').select('id,name');
    (subs || []).forEach((s: any) => { subjectCache[s.name.toLowerCase()] = s.id; });
  } catch {}

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      const grade = Number(r.grade);
      const subjectName = String(r.subject || '').trim();
      const topicName = String(r.topic || '').trim();
      const content = String(r.content || '').trim();
      if (!grade || !subjectName || !topicName || !content) { res.skipped++; continue; }

      let subjectId = subjectCache[subjectName.toLowerCase()];
      if (!subjectId) {
        const { data: sIns } = await supabase.from('subjects').insert({ name: subjectName }).select('id').maybeSingle();
        if (sIns?.id) { subjectId = sIns.id; subjectCache[subjectName.toLowerCase()] = subjectId; }
      }
      if (!subjectId) { res.skipped++; continue; }

      const tKey = `${grade}|${subjectId}|${topicName.toLowerCase()}`;
      let topicId = topicCache[tKey];
      if (!topicId) {
        const { data: tExist } = await supabase.from('topics').select('id').eq('grade_level', grade).eq('subject_id', subjectId).eq('name', topicName).maybeSingle();
        if (tExist?.id) topicId = tExist.id;
        else {
          const { data: tIns } = await supabase.from('topics').insert({ grade_level: grade, subject_id: subjectId, name: topicName }).select('id').maybeSingle();
          if (tIns?.id) topicId = tIns.id;
        }
        if (topicId) topicCache[tKey] = topicId;
      }
      if (!topicId) { res.skipped++; continue; }

      const { error } = await supabase.from('learning_items').insert({ topic_id: topicId, content, hint: r.hint ? String(r.hint).trim() : null });
      if (error) { res.errors.push(`Row ${i + 1}: ${error.message}`); res.skipped++; }
      else res.inserted++;
    } catch (e: any) {
      res.errors.push(`Row ${i + 1}: ${e?.message || 'failed'}`);
      res.skipped++;
    }
  }
  return res;
}
