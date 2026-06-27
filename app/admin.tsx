import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './lib/auth';
import { getGrades, getSubjects, Grade, Subject } from './lib/data';
import { addSubject, addTopic, addItem, getTopicsForSubject, bulkImport } from './lib/admin';
import { colors, shadow } from './lib/theme';
import Header from './components/Header';
import { Card, EmptyState } from './components/ui';

const SAMPLE = `[
  {"grade":7,"subject":"Math","topic":"Percentages","content":"50% = one half","hint":"Half of 100"},
  {"grade":7,"subject":"Math","topic":"Percentages","content":"25% = one quarter"}
]`;

export default function Admin() {
  const { isAdmin, becomeAdmin, user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<{ id: number; name: string }[]>([]);

  const [subjectName, setSubjectName] = useState('');
  const [tGrade, setTGrade] = useState<number | null>(null);
  const [tSubject, setTSubject] = useState<number | null>(null);
  const [topicName, setTopicName] = useState('');
  const [iTopic, setITopic] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [hint, setHint] = useState('');
  const [bulk, setBulk] = useState(SAMPLE);
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);

  const reload = async () => {
    setGrades(await getGrades());
    setSubjects(await getSubjects());
  };
  useEffect(() => { reload(); }, []);

  useEffect(() => {
    (async () => {
      if (tGrade && tSubject) setTopics(await getTopicsForSubject(tGrade, tSubject));
      else setTopics([]);
    })();
  }, [tGrade, tSubject]);

  const flash = (t: string, ok?: boolean) => { setMsg({ t, ok }); setTimeout(() => setMsg(null), 3000); };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Admin CMS" back />
        <EmptyState icon="lock-closed-outline" title="Sign in required" subtitle="Please sign in to access admin tools." />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="Admin CMS" subtitle="Content management" back />
        <View style={{ padding: 20 }}>
          <Card>
            <Ionicons name="key-outline" size={36} color={colors.primary} />
            <Text style={s.h}>Admin access</Text>
            <Text style={s.muted}>Enable admin mode to add grades-worth of subjects, topics, learning items, and bulk-import content — no code required.</Text>
            <Pressable style={s.primary} onPress={async () => { await becomeAdmin(); flash('You are now an admin!', true); }}>
              <Text style={s.primaryText}>Enable Admin Mode</Text>
            </Pressable>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Admin CMS" subtitle="Manage content" back />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {msg ? (
          <View style={[s.msg, { backgroundColor: msg.ok ? colors.knowBg : colors.dontBg }]}>
            <Ionicons name={msg.ok ? 'checkmark-circle' : 'alert-circle'} size={16} color={msg.ok ? colors.know : colors.dont} />
            <Text style={{ color: msg.ok ? colors.know : colors.dont, fontWeight: '600', flex: 1 }}>{msg.t}</Text>
          </View>
        ) : null}

        {/* Add Subject */}
        <Card style={{ marginBottom: 14 }}>
          <Text style={s.h}>Add Subject</Text>
          <TextInput placeholder="Subject name" placeholderTextColor={colors.muted} value={subjectName} onChangeText={setSubjectName} style={s.input} />
          <Pressable style={s.primary} onPress={async () => {
            const err = await addSubject(subjectName);
            if (err) flash(err); else { flash('Subject added!', true); setSubjectName(''); reload(); }
          }}><Text style={s.primaryText}>Add Subject</Text></Pressable>
        </Card>

        {/* Add Topic */}
        <Card style={{ marginBottom: 14 }}>
          <Text style={s.h}>Add Topic</Text>
          <Text style={s.label}>Grade</Text>
          <Chips items={grades.map(g => ({ id: g.level, label: g.label }))} value={tGrade} onChange={setTGrade} />
          <Text style={s.label}>Subject</Text>
          <Chips items={subjects.map(x => ({ id: x.id, label: x.name }))} value={tSubject} onChange={setTSubject} />
          <TextInput placeholder="Topic name" placeholderTextColor={colors.muted} value={topicName} onChangeText={setTopicName} style={s.input} />
          <Pressable style={s.primary} onPress={async () => {
            const err = await addTopic(tGrade || 0, tSubject || 0, topicName);
            if (err) flash(err); else { flash('Topic added!', true); setTopicName(''); if (tGrade && tSubject) setTopics(await getTopicsForSubject(tGrade, tSubject)); }
          }}><Text style={s.primaryText}>Add Topic</Text></Pressable>
        </Card>

        {/* Add Item */}
        <Card style={{ marginBottom: 14 }}>
          <Text style={s.h}>Add Learning Item</Text>
          <Text style={s.muted}>Select grade & subject above, then pick a topic.</Text>
          <Text style={s.label}>Topic{topics.length === 0 ? ' (pick grade+subject first)' : ''}</Text>
          <Chips items={topics.map(t => ({ id: t.id, label: t.name }))} value={iTopic} onChange={setITopic} />
          <TextInput placeholder="Content (e.g. 1/2 = one half)" placeholderTextColor={colors.muted} value={content} onChangeText={setContent} style={s.input} />
          <TextInput placeholder="Hint (optional)" placeholderTextColor={colors.muted} value={hint} onChangeText={setHint} style={s.input} />
          <Pressable style={s.primary} onPress={async () => {
            const err = await addItem(iTopic || 0, content, hint);
            if (err) flash(err); else { flash('Item added!', true); setContent(''); setHint(''); }
          }}><Text style={s.primaryText}>Add Item</Text></Pressable>
        </Card>

        {/* Bulk import */}
        <Card>
          <Text style={s.h}>Bulk Import (JSON)</Text>
          <Text style={s.muted}>Paste an array of rows. Subjects & topics auto-create if missing. Perfect for Google Sheets export.</Text>
          <TextInput multiline value={bulk} onChangeText={setBulk} style={[s.input, { height: 150, textAlignVertical: 'top', fontFamily: 'monospace' as any }]} />
          <Pressable style={s.primary} onPress={async () => {
            flash('Importing…', true);
            const r = await bulkImport(bulk);
            await reload();
            if (r.errors.length && r.inserted === 0) flash(r.errors[0]);
            else flash(`Imported ${r.inserted}, skipped ${r.skipped}.`, true);
          }}><Text style={s.primaryText}>Import Content</Text></Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

function Chips({ items, value, onChange }: { items: { id: number; label: string }[]; value: number | null; onChange: (v: number) => void }) {
  if (items.length === 0) return <Text style={s.muted}>None available</Text>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }} contentContainerStyle={{ gap: 8 }}>
      {items.map(it => (
        <Pressable key={it.id} onPress={() => onChange(it.id)} style={[s.chip, value === it.id && s.chipActive]}>
          <Text style={[s.chipText, value === it.id && { color: colors.white }]}>{it.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 8, marginTop: 6 },
  muted: { color: colors.muted, fontSize: 13, marginBottom: 10 },
  label: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, marginBottom: 12, backgroundColor: '#FBFCFE', outlineStyle: 'none' as any },
  primary: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: '800' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600' },
  msg: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 14 },
});
