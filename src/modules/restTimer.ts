import { registerPlugin } from "@capacitor/core";
import { isApp } from "@/modules/platform";

// Rest timer notification on the lock screen (Android foreground service, see RestTimerPlugin.java).
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
}

interface RestTimerPlugin {
    start(options: StartOptions): Promise<void>;
    stop(): Promise<void>;
    checkPermissions(): Promise<{ notifications: string }>;
    requestPermissions(): Promise<{ notifications: string }>;
    addListener(event: 'startSet', cb: () => void): Promise<{ remove: () => Promise<void> }>;
    addListener(event: 'restChanged', cb: (data: { endsAt: number }) => void): Promise<{ remove: () => Promise<void> }>;
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

export function stopRestNotification(): void {
    if (!isApp) return;
    RestTimer.stop().catch(() => {});
}

// Buttons of the notification. Returns a function that removes the listeners
export async function listenRestNotification(handlers: { onStartSet: () => void; onChanged: (endsAt: number) => void }): Promise<() => void> {
    if (!isApp) return () => {};

    const a = await RestTimer.addListener('startSet', handlers.onStartSet);
    const b = await RestTimer.addListener('restChanged', d => handlers.onChanged(d.endsAt));
    return () => { a.remove(); b.remove(); };
}
