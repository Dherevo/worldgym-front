import { Health } from "capacitor-health";
import { http } from "lib";
import { isApp, platform } from "@/modules/platform";

// Steps counted by the phone: Health Connect on Android and Apple Health on iOS. A band such as the Xiaomi one
// writes its steps there through its own app (Mi Fitness / Zepp), so reading the phone's health store is enough.
// Only works in the installed app: in the browser everything answers "unavailable".

const PERMISSIONS: any = ['READ_STEPS'];

export type HealthState = 'unavailable' | 'denied' | 'ready';

// Local date (Y-m-d) of a bucket: Android sends the start as an ISO string, iOS as a number
function localDay(start: string | number): string {
    const d = new Date(start);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function healthState(): Promise<HealthState> {
    if (!isApp) return 'unavailable';

    try {
        const { available } = await Health.isHealthAvailable();
        if (!available) return 'unavailable';
        // iOS does not tell whether the read permission was granted: it is asked every time it is needed
        if (platform === 'ios') return 'ready';

        const { permissions } = await Health.checkHealthPermissions({ permissions: PERMISSIONS });
        return Object.values(permissions as any).every(v => v === true) ? 'ready' : 'denied';
    } catch {
        return 'unavailable';
    }
}

// Asks for the permission. Without Health Connect installed it opens its Play Store page.
export async function connectHealth(): Promise<boolean> {
    if (!isApp) return false;

    try {
        const { available } = await Health.isHealthAvailable();
        if (!available) {
            await Health.showHealthConnectInPlayStore();
            return false;
        }

        const { permissions } = await Health.requestHealthPermissions({ permissions: PERMISSIONS });
        const granted = Object.values(permissions as any).every(v => v === true);
        if (!granted && platform === 'android') await Health.openHealthConnectSettings();
        return granted;
    } catch {
        return false;
    }
}

// Steps per day of the last `days` days, today included
export async function readSteps(days = 14): Promise<{ date: string; steps: number }[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
    // Until the end of today (not "now"): Health Connect prorates records that go past the end of the range,
    // so a band batch ending a few minutes ahead of the phone clock would be cut
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const res: any = await Health.queryAggregated({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        dataType: 'steps',
        bucket: 'day',
    });

    const perDay: Record<string, number> = {};
    for (const item of res.aggregatedData ?? []) {
        const date = localDay(item.startDate);
        perDay[date] = (perDay[date] ?? 0) + Math.round(item.value ?? 0);
    }

    return Object.entries(perDay).map(([date, steps]) => ({ date, steps }));
}

// Reads the phone's steps and sends them to the account (each day only goes up). Returns the days that changed and the
// steps of today that Health Connect had: the band's app (Mi Fitness) hands its steps to Health Connect a little after
// its own sync, so this figure shows what the phone really had when it was read
export async function syncSteps(days = 14): Promise<{ updated: number; today: number }> {
    const list = await readSteps(days);
    if (!list.length) return { updated: 0, today: 0 };

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const today = list.find(d => d.date === todayKey)?.steps ?? 0;

    const res: any = await http.post('/steps/sync').data({ days: list });
    return { updated: res?.updated ?? 0, today };
}

// Syncs the steps every time the app comes back to the foreground (the webview becomes visible again).
// Silent: if the user is not logged in or there is no permission, nothing happens
export function autoSyncSteps() {
    if (!isApp) return;

    let running = false;
    const run = async () => {
        if (running || document.visibilityState !== 'visible') return;
        running = true;
        try {
            if (await healthState() === 'ready') await syncSteps();
        } catch { /* silent */ } finally {
            running = false;
        }
    };

    document.addEventListener('visibilitychange', run);
}
