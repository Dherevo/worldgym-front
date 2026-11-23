import { reactive } from "vue";
import HttpRequest from "./request";
import { HTTPMethod } from "./types";

// Changes made without connection. A change (POST/PUT/PATCH/DELETE) that cannot reach the API is kept here, the app goes on
// as if it had been saved, and it is sent, in order, when the connection is back.
//
// The ones that create something answer with a temporary id ("tmp_...") that the screens use as the real one; when the
// creation is finally sent, the temporary id is replaced by the real one in the changes that were waiting behind it.
// Only what the user did with data already on the screen can be done offline: a screen that needs the API to open
// (for instance a workout that does not exist yet) still fails as before.

interface QueuedChange {
    method: HTTPMethod;
    url: string;
    query: any;
    body: any;
    tmpId?: string;
}

const KEY = 'wg_offline_queue';
const LIMIT = 300;

// What the app shows: a notice while there is no connection or something waits to be sent
export const offlineState = reactive({ offline: false, pending: 0, syncing: false, syncedAt: 0, dropped: 0 });

let queue: QueuedChange[] = load();
let counter = 0;
let executor: ((req: HttpRequest) => Promise<any>) | null = null;
let timer: any = null;

function load(): QueuedChange[] {
    try { return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') || []; } catch { return []; }
}

function persist() {
    offlineState.pending = queue.length;
    try { window.localStorage.setItem(KEY, JSON.stringify(queue)); } catch { /* ignored */ }
}

function replaceIds(text: string, ids: Map<string, any>): string {
    ids.forEach((real, tmp) => { text = text.split(tmp).join(String(real)); });
    return text;
}

const OfflineQueue = {

    // How the queue sends the changes: through the normal request, without queueing again
    init(run: (req: HttpRequest) => Promise<any>) {
        executor = run;
        offlineState.pending = queue.length;
        offlineState.offline = typeof navigator !== 'undefined' && navigator.onLine === false;
        window.addEventListener('online', () => { offlineState.offline = false; OfflineQueue.flush(); });
        window.addEventListener('offline', () => { offlineState.offline = true; });
        document.addEventListener('visibilitychange', () => { if (!document.hidden) OfflineQueue.flush(); });
        if (queue.length) OfflineQueue.flush();
    },

    hasPending(): boolean {
        return queue.length > 0;
    },

    // True for a failure that means "there is no connection" (not a refusal from the API)
    isNetworkFailure(status: number, data: any): boolean {
        if (status !== 0) return false;
        return (typeof navigator !== 'undefined' && navigator.onLine === false) || data?.code === 'ERR_NETWORK';
    },

    // Keeps the change and returns what the caller gets in place of the answer of the API
    enqueue(req: HttpRequest): any {
        if (queue.length >= LIMIT) queue.shift();
        const change: QueuedChange = { method: req.method, url: req.url, query: { ...req.queryParams }, body: JSON.parse(JSON.stringify(req.body ?? {})) };
        let answer: any = { ...(typeof change.body === 'object' ? change.body : {}), offline: true };
        if (req.method === 'POST') {
            counter += 1;
            change.tmpId = `tmp_${Date.now().toString(36)}_${counter}`;
            answer = { ...answer, id: change.tmpId };
        }
        queue.push(change);
        persist();
        offlineState.offline = true;
        OfflineQueue.keepTrying();
        return answer;
    },

    // Sends what is waiting, in order. It stops at the first change that finds no connection
    async flush(): Promise<void> {
        if (!executor || offlineState.syncing || !queue.length) return;
        offlineState.syncing = true;
        const ids = new Map<string, any>();
        let sent = 0;
        try {
            while (queue.length) {
                const change = queue[0];
                const req = new HttpRequest();
                req.setMethod(change.method);
                req.setUrl(replaceIds(change.url, ids));
                req.queryParams = JSON.parse(replaceIds(JSON.stringify(change.query ?? {}), ids));
                req.body = JSON.parse(replaceIds(JSON.stringify(change.body ?? {}), ids));
                req.noQueue = true;
                try {
                    const res = await executor(req);
                    if (change.tmpId && res?.id !== undefined) ids.set(change.tmpId, res.id);
                    queue.shift();
                    sent++;
                    offlineState.offline = false;
                } catch (err: any) {
                    if (OfflineQueue.isNetworkFailure(err?.status ?? 0, err?.data)) {
                        offlineState.offline = true;
                        break;
                    }
                    // The API refused this change (it no longer applies): it is dropped so it does not block the rest
                    queue.shift();
                    offlineState.dropped++;
                }
                persist();
            }
        } finally {
            persist();
            offlineState.syncing = false;
            if (sent) offlineState.syncedAt = Date.now();
        }
        if (queue.length) OfflineQueue.keepTrying();
    },

    // Without events (the connection can come back silently) it tries again from time to time while something waits
    keepTrying() {
        if (timer) return;
        timer = setInterval(() => {
            if (!queue.length) { clearInterval(timer); timer = null; return; }
            OfflineQueue.flush();
        }, 20000);
    },

    clear() {
        queue = [];
        persist();
    },
};

export default OfflineQueue;
