import { http } from "lib";
import localDate from "@/modules/localDate";
import { isApp } from "@/modules/platform";

// Fills the offline cache with the main screens, so they open without connection even if they were never visited.
// Only in the app, with a session and a connection; silent, at most once every 10 minutes.
const EVERY_MS = 10 * 60 * 1000;
let last = 0;

function days(count: number): string[] {
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        out.push(localDate(d));
    }
    return out;
}

export async function prefetchScreens() {
    if (!isApp || !http.token.get() || navigator.onLine === false) return;
    if (Date.now() - last < EVERY_MS) return;
    last = Date.now();

    const today = localDate();
    const calls: (() => Promise<any>)[] = [
        () => http.get('/week-status').data({ date: today }).promise(),
        () => http.get('/workouts/active').promise(),
        () => http.get('/routines').promise(),
        () => http.get('/workouts').promise(),
        () => http.get('/habits').promise(),
        () => http.get('/habit-catalog').promise(),
        () => http.get('/measurements').promise(),
        () => http.get('/nutrition/history').data({ days: 14 }).promise(),
        ...days(8).map(date => () => http.get('/nutrition/day').data({ date }).promise()),
    ];
    // One by one: it must not compete with what the user is opening
    for (const call of calls) {
        try { await call(); } catch { /* silent: whatever fails is simply not cached */ }
    }
}

export function autoPrefetch() {
    if (!isApp) return;
    setTimeout(prefetchScreens, 4000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(prefetchScreens, 4000); });
}
