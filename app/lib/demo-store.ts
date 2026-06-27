import { getJSON, setJSON } from './storage';
import type { Grade, Subject, Topic, Item, ProgressMap } from './data';
import type { StatusKey } from './theme';
type BulkResult = { inserted: number; skipped: number; errors: string[] };

const STORE_KEY = 'st_demo_store_v1';
const SESSION_KEY = 'st_demo_session';
const ADMIN_KEY = 'st_demo_admins';

type DemoUser = { id: string; email: string; password: string };
type DemoStore = {
  grades: Grade[];
  subjects: Subject[];
  topics: Topic[];
  items: Item[];
  progress: Record<string, ProgressMap>;
  users: DemoUser[];
  nextSubjectId: number;
  nextTopicId: number;
  nextItemId: number;
};

function buildSeedStore(): DemoStore {
  const grades: Grade[] = [5, 6, 7, 8, 9, 10, 11, 12, 13].map((level, i) => ({
    id: i + 1,
    level,
    label: `Grade ${level}`,
  }));

  const subjects: Subject[] = [
    { id: 1, name: 'Mathematics', icon: 'calculator', color: '#2563EB', sort_order: 1 },
    { id: 2, name: 'German', icon: 'book-open', color: '#DC2626', sort_order: 2 },
    { id: 3, name: 'English', icon: 'language', color: '#7C3AED', sort_order: 3 },
    { id: 4, name: 'Biology', icon: 'leaf', color: '#16A34A', sort_order: 4 },
    { id: 5, name: 'History', icon: 'time', color: '#B45309', sort_order: 5 },
    { id: 6, name: 'Geography', icon: 'earth', color: '#0891B2', sort_order: 6 },
    { id: 7, name: 'Physics', icon: 'flash', color: '#4F46E5', sort_order: 7 },
    { id: 8, name: 'Chemistry', icon: 'flask', color: '#DB2777', sort_order: 8 },
    { id: 9, name: 'Latin', icon: 'school', color: '#64748B', sort_order: 9 },
    { id: 10, name: 'French', icon: 'language', color: '#0284C7', sort_order: 10 },
  ];

  const topics: Topic[] = [];
  const items: Item[] = [];
  let topicId = 1;
  let itemId = 1;

  const topicDefs: Record<number, Record<string, { name: string; items: { content: string; hint?: string }[] }[]>> = {
    1: {
      'Mathematics': [
        { name: 'Fractions', items: [
          { content: '1/2 = one half', hint: 'Half of 100 is 50' },
          { content: '1/4 = one quarter', hint: 'Quarter of 20 is 5' },
          { content: '3/4 = three quarters', hint: 'Three quarters of 8 is 6' },
          { content: '2/5 = two fifths', hint: 'Two fifths of 15 is 6' },
        ]},
        { name: 'Percentages', items: [
          { content: '50% = one half', hint: '50% of 80 = 40' },
          { content: '25% = one quarter', hint: '25% of 200 = 50' },
          { content: '10% = one tenth', hint: 'Move decimal one place left' },
        ]},
      ],
      'German': [
        { name: 'Nomen (Nouns)', items: [
          { content: 'der Junge — the boy', hint: 'Masculine article: der' },
          { content: 'die Schule — the school', hint: 'Feminine article: die' },
          { content: 'das Buch — the book', hint: 'Neuter article: das' },
        ]},
        { name: 'Verben (Verbs)', items: [
          { content: 'lernen — to learn', hint: 'Regular verb' },
          { content: 'gehen — to go', hint: 'Irregular: ich gehe' },
          { content: 'haben — to have', hint: 'ich habe, du hast' },
        ]},
      ],
      'English': [
        { name: 'Present Simple', items: [
          { content: 'I play football every day.', hint: 'Habit / routine' },
          { content: 'She reads books in the evening.', hint: 'Third person: reads (+s)' },
          { content: 'They live in Berlin.', hint: 'Plural subject → base verb' },
        ]},
      ],
      'Biology': [
        { name: 'The Cell', items: [
          { content: 'Zellkern — nucleus', hint: 'Controls the cell' },
          { content: 'Zellmembran — cell membrane', hint: 'Protects the cell' },
          { content: 'Photosynthese — photosynthesis', hint: 'Plants make glucose from light' },
        ]},
      ],
      'History': [
        { name: 'Ancient Rome', items: [
          { content: 'Romulus and Remus — founding legend', hint: 'Twin brothers raised by a wolf' },
          { content: 'Senate — governing council of Rome', hint: 'Latin: senex = old man' },
        ]},
      ],
    },
    2: {
      'Mathematics': [
        { name: 'Linear Equations', items: [
          { content: 'x + 5 = 12 → x = 7', hint: 'Subtract 5 from both sides' },
          { content: '2x = 10 → x = 5', hint: 'Divide both sides by 2' },
          { content: '3x + 2 = 11 → x = 3', hint: 'Subtract 2, then divide by 3' },
        ]},
        { name: 'Geometry', items: [
          { content: 'Area of rectangle = length × width', hint: 'A = l × w' },
          { content: 'Area of triangle = ½ × base × height', hint: 'A = ½bh' },
          { content: 'Circumference of circle = 2πr', hint: 'π ≈ 3.14' },
        ]},
      ],
      'German': [
        { name: 'Adjektive', items: [
          { content: 'groß — big / tall', hint: 'Comparative: größer' },
          { content: 'schnell — fast', hint: 'Comparative: schneller' },
          { content: 'schön — beautiful', hint: 'Superlative: am schönsten' },
        ]},
      ],
      'English': [
        { name: 'Past Simple', items: [
          { content: 'I visited London last year.', hint: 'Regular: visit → visited' },
          { content: 'She went to the cinema.', hint: 'Irregular: go → went' },
          { content: 'They didn\'t finish the homework.', hint: 'Negative: didn\'t + base verb' },
        ]},
      ],
      'Physics': [
        { name: 'Forces', items: [
          { content: 'Force (F) = mass (m) × acceleration (a)', hint: 'F = ma (Newton\'s 2nd law)' },
          { content: 'Gravity on Earth ≈ 9.81 m/s²', hint: 'Acceleration due to gravity' },
          { content: 'Weight = mass × gravitational acceleration', hint: 'W = mg' },
        ]},
      ],
      'Chemistry': [
        { name: 'Elements', items: [
          { content: 'H — Hydrogen', hint: 'Atomic number 1' },
          { content: 'O — Oxygen', hint: 'Atomic number 8' },
          { content: 'Na — Sodium', hint: 'From Latin natrium' },
        ]},
      ],
    },
    3: {
      'Mathematics': [
        { name: 'Quadratic Equations', items: [
          { content: 'x² = 16 → x = ±4', hint: 'Two solutions: +4 and -4' },
          { content: 'Quadratic formula: x = (-b ± √(b²-4ac)) / 2a', hint: 'For ax² + bx + c = 0' },
        ]},
      ],
      'Latin': [
        { name: '1st Declension', items: [
          { content: 'puella — girl (nominative)', hint: 'puella, puellae, puellae…' },
          { content: 'terra — earth / land', hint: 'Feminine noun ending in -a' },
        ]},
      ],
      'Geography': [
        { name: 'Germany', items: [
          { content: 'Capital: Berlin', hint: 'Since reunification in 1990' },
          { content: 'Longest river: Rhine (Rhein)', hint: 'Flows through Cologne' },
          { content: 'Highest peak: Zugspitze (2,962 m)', hint: 'In the Bavarian Alps' },
        ]},
      ],
    },
  };

  // Demo content for grades 7, 8, 9 (indices 2, 3, 4 in grades array)
  const demoGrades = [7, 8, 9];
  for (const grade of demoGrades) {
    const gradeIdx = grade - 5; // maps to topicDefs key
    const defs = topicDefs[gradeIdx];
    if (!defs) continue;
    for (const subject of subjects) {
      const subjectTopics = defs[subject.name];
      if (!subjectTopics) continue;
      for (let i = 0; i < subjectTopics.length; i++) {
        const td = subjectTopics[i];
        topics.push({
          id: topicId,
          grade_level: grade,
          subject_id: subject.id,
          name: td.name,
          sort_order: i + 1,
        });
        td.items.forEach((it, j) => {
          items.push({
            id: itemId++,
            topic_id: topicId,
            content: it.content,
            hint: it.hint || null,
            sort_order: j + 1,
          });
        });
        topicId++;
      }
    }
  }

  return {
    grades,
    subjects,
    topics,
    items,
    progress: {},
    users: [],
    nextSubjectId: subjects.length + 1,
    nextTopicId: topicId,
    nextItemId: itemId,
  };
}

async function loadStore(): Promise<DemoStore> {
  const existing = await getJSON<DemoStore | null>(STORE_KEY, null);
  if (existing?.grades?.length) return existing;
  const seed = buildSeedStore();
  await setJSON(STORE_KEY, seed);
  return seed;
}

async function saveStore(store: DemoStore): Promise<void> {
  await setJSON(STORE_KEY, store);
}

function uid(): string {
  return `demo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export type DemoSession = { user: { id: string; email: string } };

export async function demoGetSession(): Promise<DemoSession | null> {
  return getJSON<DemoSession | null>(SESSION_KEY, null);
}

export async function demoSignUp(email: string, password: string): Promise<{ error?: string; user?: DemoSession['user'] }> {
  const store = await loadStore();
  const normalized = email.trim().toLowerCase();
  if (store.users.some(u => u.email === normalized)) {
    return { error: 'An account with this email already exists.' };
  }
  const user = { id: uid(), email: normalized, password };
  store.users.push(user);
  await saveStore(store);
  const session = { user: { id: user.id, email: user.email } };
  await setJSON(SESSION_KEY, session);
  return { user: session.user };
}

export async function demoSignIn(email: string, password: string): Promise<{ error?: string; user?: DemoSession['user'] }> {
  const store = await loadStore();
  const normalized = email.trim().toLowerCase();
  const user = store.users.find(u => u.email === normalized && u.password === password);
  if (!user) return { error: 'Invalid email or password.' };
  const session = { user: { id: user.id, email: user.email } };
  await setJSON(SESSION_KEY, session);
  return { user: session.user };
}

export async function demoSignOut(): Promise<void> {
  await setJSON(SESSION_KEY, null);
}

export async function demoResetPassword(_email: string): Promise<{ ok?: boolean; error?: string }> {
  // Demo mode: simulate success (no email sent)
  return { ok: true };
}

export async function demoIsAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const admins = await getJSON<string[]>(ADMIN_KEY, []);
  return admins.includes(userId);
}

export async function demoBecomeAdmin(userId: string): Promise<void> {
  const admins = await getJSON<string[]>(ADMIN_KEY, []);
  if (!admins.includes(userId)) {
    admins.push(userId);
    await setJSON(ADMIN_KEY, admins);
  }
}

// ── Content reads ─────────────────────────────────────────────────────────────

export async function demoGetGrades(): Promise<Grade[]> {
  const store = await loadStore();
  return store.grades;
}

export async function demoGetSubjects(): Promise<Subject[]> {
  const store = await loadStore();
  return [...store.subjects].sort((a, b) => a.sort_order - b.sort_order);
}

export async function demoGetTopics(grade: number, subjectId: number): Promise<Topic[]> {
  const store = await loadStore();
  return store.topics
    .filter(t => t.grade_level === grade && t.subject_id === subjectId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function demoGetItems(topicId: number, from = 0, limit = 50): Promise<Item[]> {
  const store = await loadStore();
  return store.items
    .filter(i => i.topic_id === topicId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(from, from + limit);
}

export async function demoGetProgressForItems(userId: string, itemIds: number[]): Promise<ProgressMap> {
  const store = await loadStore();
  const userProgress = store.progress[userId] || {};
  const result: ProgressMap = {};
  for (const id of itemIds) {
    if (userProgress[id]) result[id] = userProgress[id];
  }
  return result;
}

export async function demoSetProgress(userId: string, itemId: number, status: StatusKey): Promise<boolean> {
  const store = await loadStore();
  if (!store.progress[userId]) store.progress[userId] = {};
  store.progress[userId][itemId] = status;
  await saveStore(store);
  return true;
}

// ── Admin writes ──────────────────────────────────────────────────────────────

export async function demoAddSubject(name: string, color = '#3B82F6'): Promise<string | null> {
  if (!name.trim()) return 'Name required';
  const store = await loadStore();
  store.subjects.push({
    id: store.nextSubjectId++,
    name: name.trim(),
    icon: 'book',
    color,
    sort_order: store.subjects.length + 1,
  });
  await saveStore(store);
  return null;
}

export async function demoAddTopic(grade: number, subjectId: number, name: string): Promise<string | null> {
  if (!name.trim()) return 'Name required';
  if (!grade || !subjectId) return 'Grade & subject required';
  const store = await loadStore();
  store.topics.push({
    id: store.nextTopicId++,
    grade_level: grade,
    subject_id: subjectId,
    name: name.trim(),
    sort_order: store.topics.filter(t => t.grade_level === grade && t.subject_id === subjectId).length + 1,
  });
  await saveStore(store);
  return null;
}

export async function demoAddItem(topicId: number, content: string, hint?: string): Promise<string | null> {
  if (!content.trim()) return 'Content required';
  if (!topicId) return 'Topic required';
  const store = await loadStore();
  store.items.push({
    id: store.nextItemId++,
    topic_id: topicId,
    content: content.trim(),
    hint: hint?.trim() || null,
    sort_order: store.items.filter(i => i.topic_id === topicId).length + 1,
  });
  await saveStore(store);
  return null;
}

export async function demoGetTopicsForSubject(grade: number, subjectId: number) {
  const topics = await demoGetTopics(grade, subjectId);
  return topics.map(t => ({ id: t.id, name: t.name }));
}

export async function demoBulkImport(raw: string): Promise<BulkResult> {
  const res: BulkResult = { inserted: 0, skipped: 0, errors: [] };
  let rows: { grade: number | string; subject: string; topic: string; content: string; hint?: string }[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { res.errors.push('JSON must be an array of rows.'); return res; }
    rows = parsed;
  } catch {
    res.errors.push('Invalid JSON. Please check the format.');
    return res;
  }

  const store = await loadStore();
  const subjectCache: Record<string, number> = {};
  store.subjects.forEach(s => { subjectCache[s.name.toLowerCase()] = s.id; });
  const topicCache: Record<string, number> = {};

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
        subjectId = store.nextSubjectId++;
        store.subjects.push({ id: subjectId, name: subjectName, icon: 'book', color: '#3B82F6', sort_order: store.subjects.length + 1 });
        subjectCache[subjectName.toLowerCase()] = subjectId;
      }

      const tKey = `${grade}|${subjectId}|${topicName.toLowerCase()}`;
      let topicId = topicCache[tKey];
      if (!topicId) {
        const existing = store.topics.find(t => t.grade_level === grade && t.subject_id === subjectId && t.name.toLowerCase() === topicName.toLowerCase());
        if (existing) topicId = existing.id;
        else {
          topicId = store.nextTopicId++;
          store.topics.push({
            id: topicId,
            grade_level: grade,
            subject_id: subjectId,
            name: topicName,
            sort_order: store.topics.filter(t => t.grade_level === grade && t.subject_id === subjectId).length + 1,
          });
        }
        topicCache[tKey] = topicId;
      }

      store.items.push({
        id: store.nextItemId++,
        topic_id: topicId,
        content,
        hint: r.hint ? String(r.hint).trim() : null,
        sort_order: store.items.filter(it => it.topic_id === topicId).length + 1,
      });
      res.inserted++;
    } catch (e: any) {
      res.errors.push(`Row ${i + 1}: ${e?.message || 'failed'}`);
      res.skipped++;
    }
  }

  await saveStore(store);
  return res;
}

export async function demoGetGradeAnalytics(userId: string, grade: number) {
  const store = await loadStore();
  const subjects = [...store.subjects].sort((a, b) => a.sort_order - b.sort_order);
  const topics = store.topics.filter(t => t.grade_level === grade);
  const topicIds = topics.map(t => t.id);
  const items = store.items.filter(i => topicIds.includes(i.topic_id));
  const progress = store.progress[userId] || {};

  const topicToSubject: Record<number, number> = {};
  topics.forEach(t => { topicToSubject[t.id] = t.subject_id; });

  const stats: Record<number, { subject: Subject; total: number; known: number; kinda: number; dont: number }> = {};
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
