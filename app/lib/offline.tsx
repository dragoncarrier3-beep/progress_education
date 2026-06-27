import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { getJSON, setJSON, CACHE_KEYS } from './storage';
import { setProgress, QueueItem } from './data';
import type { StatusKey } from './theme';

type SyncState = {
  online: boolean;
  syncing: boolean;
  pending: number;
  lastSyncedAt: number | null;
  enqueue: (userId: string, itemId: number, status: StatusKey) => Promise<void>;
  flush: () => Promise<void>;
};

const Ctx = createContext<SyncState>({} as SyncState);

function detectOnline(): boolean {
  try {
    const nav = (globalThis as any).navigator;
    if (nav && typeof nav.onLine === 'boolean') return nav.onLine;
  } catch {}
  return true; // assume online if we can't tell
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState<boolean>(detectOnline());
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const flushing = useRef(false);

  const refreshPending = useCallback(async () => {
    const q = await getJSON<QueueItem[]>(CACHE_KEYS.queue, []);
    setPending(q.length);
    return q;
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    if (!detectOnline()) { setOnline(false); return; }
    flushing.current = true;
    try {
      let queue = await getJSON<QueueItem[]>(CACHE_KEYS.queue, []);
      if (queue.length === 0) { setSyncing(false); return; }
      setSyncing(true);
      // process oldest first
      queue = queue.slice().sort((a, b) => a.ts - b.ts);
      const remaining: QueueItem[] = [];
      let anyFailed = false;
      for (const item of queue) {
        if (anyFailed) { remaining.push(item); continue; }
        const ok = await setProgress(item.userId, item.itemId, item.status);
        if (!ok) { anyFailed = true; remaining.push(item); }
      }
      await setJSON(CACHE_KEYS.queue, remaining);
      setPending(remaining.length);
      if (anyFailed) {
        setOnline(false);
      } else {
        setOnline(true);
        setLastSyncedAt(Date.now());
      }
    } catch {
      // never crash
    } finally {
      setSyncing(false);
      flushing.current = false;
    }
  }, []);

  const enqueue = useCallback(async (userId: string, itemId: number, status: StatusKey) => {
    if (!userId) return;
    const queue = await getJSON<QueueItem[]>(CACHE_KEYS.queue, []);
    // keep only the latest status per (user,item)
    const filtered = queue.filter(q => !(q.userId === userId && q.itemId === itemId));
    filtered.push({ userId, itemId, status, ts: Date.now() });
    await setJSON(CACHE_KEYS.queue, filtered);
    setPending(filtered.length);
    // attempt immediate sync
    flush();
  }, [flush]);

  // connectivity listeners (web)
  useEffect(() => {
    const goOnline = () => { setOnline(true); flush(); };
    const goOffline = () => setOnline(false);
    try {
      const w = globalThis as any;
      if (w.addEventListener) {
        w.addEventListener('online', goOnline);
        w.addEventListener('offline', goOffline);
      }
    } catch {}
    return () => {
      try {
        const w = globalThis as any;
        if (w.removeEventListener) {
          w.removeEventListener('online', goOnline);
          w.removeEventListener('offline', goOffline);
        }
      } catch {}
    };
  }, [flush]);

  // periodic retry + initial pending count
  useEffect(() => {
    refreshPending().then(q => { if (q.length) flush(); });
    const id = setInterval(() => {
      setOnline(detectOnline());
      flush();
    }, 15000);
    return () => clearInterval(id);
  }, [flush, refreshPending]);

  return (
    <Ctx.Provider value={{ online, syncing, pending, lastSyncedAt, enqueue, flush }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSync = () => useContext(Ctx);
