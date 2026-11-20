import { registerPlugin } from "@capacitor/core";
import { isApp } from "@/modules/platform";

// Workout notification on the lock screen: set running, logging the set, rest countdown (Android foreground service,
// see RestTimerPlugin.java).
// Only exists in the installed app: in the browser every function does nothing.

interface StartOptions {
    endsAt: number;
    title: string;
    text: string;
    addLabel: string;
    subLabel: string;
    startLabel: string;
    doneTitle: string;
    doneText: string;
    // Planned sets done: when the rest ends offer an extra set / the next exercise instead of the next set
    choose?: boolean;
    extraLabel?: string;
    nextLabel?: string;
}

interface ActiveOptions {
    startedAt: number;
    title: string;
    text: string;
    finishLabel: string;
}

interface LoggingOptions {
    title: string;
    text: string;
    sameLabel: string;
    editLabel: string;
    inputHint: string;
    savingText: string;
    reps: number;
    weight: number;
}

interface ReadyOptions {
    title: string;
    text: string;
    startLabel: string;
}

// What the user sent from the notification when logging a set: the suggested values, or text they typed
export interface LoggedSet {
    reps?: number;
    weight?: number;
    input?: string;
}

interface RestTimerPlugin {
    start(options: StartOptions): Promise<void>;
    showActive(options: ActiveOptions): Promise<void>;
    showLogging(options: LoggingOptions): Promise<void>;
    showReady(options: ReadyOptions): Promise<void>;
    stop(): Promise<void>;
    checkPermissions(): Promise<{ notifications: string }>;
    requestPermissions(): Promise<{ notifications: string }>;
    addListener(event: 'startSet', cb: () => void): Promise<{ remove: () => Promise<void> }>;
    addListener(event: 'restChanged', cb: (data: { endsAt: number }) => void): Promise<{ remove: () => Promise<void> }>;
    addListener(event: 'stopSet' | 'extraSet' | 'nextExercise', cb: () => void): Promise<{ remove: () => Promise<void> }>;
    addListener(event: 'logSet', cb: (data: LoggedSet) => void): Promise<{ remove: () => Promise<void> }>;
}

const RestTimer = registerPlugin<RestTimerPlugin>('RestTimer');

// Asks for the notification permission (Android 13+) the first time; later calls just check it
async function ensurePermission(): Promise<void> {
    try {
        const { notifications } = await RestTimer.checkPermissions();
        if (notifications !== 'granted') await RestTimer.requestPermissions();
    } catch { /* without permission the rest still works inside the app */ }
}

export async function startRestNotification(options: StartOptions): Promise<void> {
    if (!isApp) return;
    await ensurePermission();
    try { await RestTimer.start(options); } catch { /* ignored */ }
}

export async function showActiveNotification(options: ActiveOptions): Promise<void> {
    if (!isApp) return;
    await ensurePermission();
    try { await RestTimer.showActive(options); } catch { /* ignored */ }
}

export async function showLoggingNotification(options: LoggingOptions): Promise<void> {
    if (!isApp) return;
    await ensurePermission();
    try { await RestTimer.showLogging(options); } catch { /* ignored */ }
}

export async function showReadyNotification(options: ReadyOptions): Promise<void> {
    if (!isApp) return;
    await ensurePermission();
    try { await RestTimer.showReady(options); } catch { /* ignored */ }
}

export function stopRestNotification(): void {
    if (!isApp) return;
    RestTimer.stop().catch(() => {});
}

interface NotificationHandlers {
    onStartSet: () => void;
    onChanged: (endsAt: number) => void;
    onStopSet: () => void;
    onLogSet: (set: LoggedSet) => void;
    onExtraSet: () => void;
    onNextExercise: () => void;
}

// Buttons of the notification. Returns a function that removes the listeners
export async function listenRestNotification(handlers: NotificationHandlers): Promise<() => void> {
    if (!isApp) return () => {};

    const all = await Promise.all([
        RestTimer.addListener('startSet', handlers.onStartSet),
        RestTimer.addListener('restChanged', d => handlers.onChanged(d.endsAt)),
        RestTimer.addListener('stopSet', handlers.onStopSet),
        RestTimer.addListener('logSet', handlers.onLogSet),
        RestTimer.addListener('extraSet', handlers.onExtraSet),
        RestTimer.addListener('nextExercise', handlers.onNextExercise),
    ]);
    return () => { all.forEach(h => h.remove()); };
}
