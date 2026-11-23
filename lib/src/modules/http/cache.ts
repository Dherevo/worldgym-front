// Cache of GET responses. It does two things:
//  - while an answer is recent (TTL) it is served without calling the API, so moving between tabs is instant;
//  - when the phone has no connection, the last answer of any age is served instead of an error.
// It lives in memory and in IndexedDB (so it survives closing the app). Any change sent to the API (POST/PUT/PATCH/DELETE)
// clears it all, so a screen never shows data older than what the user did. It is emptied on log out.

interface Entry { key: string; data: any; at: number }

const DB_NAME = 'wg_http_cache';
const STORE = 'entries';
const TTL_MS = 2 * 60 * 1000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 400;

const mem = new Map<string, Entry>();
let db: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase | null> {
    return new Promise(resolve => {
        try {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: 'key' }); };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        } catch { resolve(null); }
    });
}

function store(mode: IDBTransactionMode): IDBObjectStore | null {
    try { return db ? db.transaction(STORE, mode).objectStore(STORE) : null; } catch { return null; }
}

const ready: Promise<void> = openDb().then(opened => {
    db = opened;
    const s = store('readonly');
    if (!s) return;
    return new Promise<void>(resolve => {
        const req = s.getAll();
        req.onsuccess = () => {
            const now = Date.now();
            (req.result as Entry[]).forEach(e => { if (now - e.at < MAX_AGE_MS) mem.set(e.key, e); });
            resolve();
        };
        req.onerror = () => resolve();
    });
});

function copy<T>(v: T): T {
    return v === undefined ? v : JSON.parse(JSON.stringify(v));
}

const HttpCache = {

    ready,

    // The entry for a key, if there is one (a copy: callers can change it freely)
    get(key: string): { data: any; fresh: boolean } | null {
        const e = mem.get(key);
        if (!e) return null;
        return { data: copy(e.data), fresh: Date.now() - e.at < TTL_MS };
    },

    set(key: string, data: any) {
        const entry: Entry = { key, data: copy(data), at: Date.now() };
        mem.set(key, entry);
        if (mem.size > MAX_ENTRIES) {
            const oldest = [...mem.values()].sort((a, b) => a.at - b.at).slice(0, mem.size - MAX_ENTRIES);
            oldest.forEach(e => { mem.delete(e.key); store('readwrite')?.delete(e.key); });
        }
        try { store('readwrite')?.put(entry); } catch { /* the memory copy still works */ }
    },

    clear() {
        mem.clear();
        try { store('readwrite')?.clear(); } catch { /* ignored */ }
    },
};

export default HttpCache;
