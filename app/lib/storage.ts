// Cross-platform, crash-proof key-value storage.
// Uses localStorage on web, in-memory fallback elsewhere. Never throws.

const mem: Record<string, string> = {};

function hasLocalStorage(): boolean {
  try {
    return typeof globalThis !== 'undefined' && !!(globalThis as any).localStorage;
  } catch {
    return false;
  }
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (hasLocalStorage()) return (globalThis as any).localStorage.getItem(key);
      return key in mem ? mem[key] : null;
    } catch {
      return key in mem ? mem[key] : null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (hasLocalStorage()) { (globalThis as any).localStorage.setItem(key, value); return; }
      mem[key] = value;
    } catch {
      mem[key] = value;
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (hasLocalStorage()) { (globalThis as any).localStorage.removeItem(key); return; }
      delete mem[key];
    } catch {
      delete mem[key];
    }
  },
};

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await storage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export async function setJSON(key: string, value: any): Promise<void> {
  try {
    await storage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore — caching is best-effort
  }
}

export const CACHE_KEYS = {
  grades: 'st_cache_grades',
  subjects: 'st_cache_subjects',
  topics: (grade: number, subjectId: number) => `st_cache_topics_${grade}_${subjectId}`,
  items: (topicId: number) => `st_cache_items_${topicId}`,
  progress: (userId: string) => `st_cache_progress_${userId}`,
  queue: 'st_progress_queue',
};
