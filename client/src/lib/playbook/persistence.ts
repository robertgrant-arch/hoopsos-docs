import { PlaybookSnapshot, PlaybookSnapshotSchema, PlaybookStoreSchema } from './schema';

/**
 * Enterprise IndexedDB persistence layer for Playbook Studio v2 — native IDB.
 * - WAL append/flush via multi-store atomic transactions
 * - Zod validation on read AND write
 * - saveWithRetry exponential backoff (1s/2s/4s/8s/16s)
 * - visibilitychange flush
 * - CORRUPT_DATA recovery signal
 *
 * NOTE: Uses native browser IndexedDB. A future PR may swap to `idb` for ergonomics
 * once the dep is added to the workspace; the public API here is stable.
 */

const DB_NAME = 'hoopsos-playbook';
const DB_VERSION = 2;
const STORE_SNAPSHOT = 'snapshots';
const STORE_WAL = 'wal';

export const CORRUPT_DATA = Symbol('CORRUPT_DATA');
export type LoadResult = PlaybookSnapshot | typeof CORRUPT_DATA | null;

export interface WalEntry {
  id?: number;
  playId: string;
  ts: number;
  patch: unknown;
}

let dbPromise: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const database = req.result;
        if (!database.objectStoreNames.contains(STORE_SNAPSHOT)) {
          database.createObjectStore(STORE_SNAPSHOT, { keyPath: 'playId' });
        }
        if (!database.objectStoreNames.contains(STORE_WAL)) {
          database.createObjectStore(STORE_WAL, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx<T>(stores: string[], mode: IDBTransactionMode, run: (t: IDBTransaction) => Promise<T> | T): Promise<T> {
  return db().then(database => new Promise<T>((resolve, reject) => {
    const t = database.transaction(stores, mode);
    let result: T | undefined;
    Promise.resolve(run(t)).then(r => { result = r; }).catch(reject);
    t.oncomplete = () => resolve(result as T);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

function reqAsPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function persistSnapshot(playId: string, snapshot: PlaybookSnapshot): Promise<void> {
  PlaybookSnapshotSchema.parse(snapshot);
  await tx([STORE_SNAPSHOT], 'readwrite', t => {
    t.objectStore(STORE_SNAPSHOT).put({ playId, schemaVersion: 2, snapshot, savedAt: Date.now() });
  });
}

export async function loadSnapshot(playId: string): Promise<LoadResult> {
  const row = await tx([STORE_SNAPSHOT], 'readonly', t => reqAsPromise(t.objectStore(STORE_SNAPSHOT).get(playId) as IDBRequest<any>));
  if (!row) return null;
  const parsed = PlaybookStoreSchema.safeParse({ schemaVersion: row.schemaVersion ?? 2, snapshot: row.snapshot });
  if (!parsed.success) return CORRUPT_DATA;
  return parsed.data.snapshot;
}

export async function appendWal(entry: WalEntry): Promise<void> {
  await tx([STORE_WAL], 'readwrite', t => {
    t.objectStore(STORE_WAL).add(entry);
  });
}

export async function flushWal(playId: string, snapshot: PlaybookSnapshot): Promise<void> {
  PlaybookSnapshotSchema.parse(snapshot);
  await tx([STORE_SNAPSHOT, STORE_WAL], 'readwrite', t => new Promise<void>((resolve, reject) => {
    t.objectStore(STORE_SNAPSHOT).put({ playId, schemaVersion: 2, snapshot, savedAt: Date.now() });
    const cursorReq = t.objectStore(STORE_WAL).openCursor();
    cursorReq.onsuccess = () => {
      const cur = cursorReq.result;
      if (!cur) { resolve(); return; }
      if ((cur.value as WalEntry).playId === playId) cur.delete();
      cur.continue();
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  }));
}

export async function recoverInProgressEdit(playId: string): Promise<WalEntry[]> {
  const all = await tx<WalEntry[]>([STORE_WAL], 'readonly', t => reqAsPromise(t.objectStore(STORE_WAL).getAll() as IDBRequest<WalEntry[]>));
  return all.filter(e => e.playId === playId).sort((a, b) => a.ts - b.ts);
}

const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000];
export async function saveWithRetry(playId: string, snapshot: PlaybookSnapshot): Promise<void> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < BACKOFF_MS.length; attempt++) {
    try {
      await persistSnapshot(playId, snapshot);
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < BACKOFF_MS.length - 1) {
        await new Promise(r => setTimeout(r, BACKOFF_MS[attempt]));
      }
    }
  }
  throw lastErr ?? new Error('saveWithRetry exhausted');
}

export function installVisibilityFlush(getSnapshot: () => { playId: string; snapshot: PlaybookSnapshot } | null): () => void {
  if (typeof document === 'undefined') return () => {};
  const handler = () => {
    if (document.visibilityState === 'hidden') {
      const cur = getSnapshot();
      if (cur) {
        void flushWal(cur.playId, cur.snapshot).catch(() => {});
      }
    }
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}

export function useCorruptDataRecovery(onCorrupt: () => void) {
  return async (playId: string): Promise<PlaybookSnapshot | null> => {
    const r = await loadSnapshot(playId);
    if (r === CORRUPT_DATA) {
      onCorrupt();
      return null;
    }
    return r;
  };
}
