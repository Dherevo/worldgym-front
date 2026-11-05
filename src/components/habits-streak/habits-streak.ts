import { Component, Vue, toNative } from "vue-facing-decorator";
import { http } from "lib";
import localDate from "@/modules/localDate";

// Warm-up and stretching are done inside the workout, so they are not daily must-dos (same as the home card)
const IN_WORKOUT = ['warmup', 'stretch'];
// Streaks look back this far (the API accepts a range of up to 366 days)
const LOOKBACK_DAYS = 364;
const GRID_DAYS = 30;

type DayState = 'done' | 'partial' | 'none' | 'off';

// Streak of the daily must-dos: consecutive days with all of them done, a calendar of the last 30 days
// and the streak of each habit on its own
@Component({})
class HabitsStreak extends Vue {

    loading = false;
    rows: { id: number; key: string | null; name: string | null; current: number; best: number }[] = [];
    days: { date: string; day: number; state: DayState }[] = [];
    current = 0;
    best = 0;
    doneDays = 0;

    created() {
        this.load();
    }

    load() {
        this.loading = true;
        const today = localDate();
        const [y, m, d] = today.split('-').map(Number);
        const from = localDate(new Date(y, m - 1, d - LOOKBACK_DAYS));

        http.get('/habits').data({ date: today })
        .then((res: any) => {
            const habits = (res.habits ?? []).filter((h: any) => h.is_active && !IN_WORKOUT.includes(h.key));
            return Promise.all(habits.map((h: any) => http.get(`/habits/${h.id}/history`).data({ from, to: today }).then((hist: any) => ({ h, hist }))));
        })
        .then((items: any[]) => this.build(items, from, today))
        .catch(() => {})
        .finally(() => { this.loading = false; });
    }

    build(items: { h: any; hist: any }[], from: string, today: string) {
        this.rows = items.map(({ h, hist }) => ({ id: h.id, key: h.key, name: h.name, current: hist.current_streak ?? 0, best: hist.best_streak ?? 0 }));
        if (!items.length) return;

        const due = items.map(({ hist }) => new Set<string>(hist.due_dates ?? []));
        const done = items.map(({ hist }) => new Set<string>((hist.days ?? []).filter((x: any) => x.completed).map((x: any) => x.date)));

        const [fy, fm, fd] = from.split('-').map(Number);
        const all: { date: string; day: number; state: DayState }[] = [];
        for (let i = 0; i <= LOOKBACK_DAYS; i++) {
            const dt = new Date(fy, fm - 1, fd + i);
            const date = localDate(dt);
            let dueCount = 0, doneCount = 0;
            items.forEach((_, k) => {
                if (!due[k].has(date)) return;
                dueCount++;
                if (done[k].has(date)) doneCount++;
            });
            const state: DayState = dueCount === 0 ? 'off' : doneCount === dueCount ? 'done' : doneCount > 0 ? 'partial' : 'none';
            all.push({ date, day: dt.getDate(), state });
        }

        // A day that is not scheduled neither extends nor breaks the streak; today still pending does not break it
        let current = 0, best = 0;
        for (const x of all) {
            if (x.state === 'off') continue;
            if (x.state === 'done') {
                current++;
                best = Math.max(best, current);
            } else if (x.date !== today) {
                current = 0;
            }
        }
        this.current = current;
        this.best = best;
        this.doneDays = all.filter(x => x.state === 'done').length;
        this.days = all.slice(-GRID_DAYS);
    }
}
export default toNative(HabitsStreak);
