import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import localDate from "@/modules/localDate";
import userStore from "@/modules/userStore";
import { proteinRange } from "@/modules/calories";
import { loadEnergyDay } from "@/modules/energyDay";

interface Row { date: string; label: string; eaten: number; burned: number | null; protein: number; balance: number | null; today: boolean }

interface Cell { date: string; day: number; kcal: number; state: 'ok' | 'over' | 'low' | 'none'; today: boolean; future: boolean }

const pad = (n: number) => String(n).padStart(2, '0');

// Month calendar of what was eaten: every day with its calories and whether it ended inside the goal saved for it.
// Tapping a day opens Menjar on that day
@Component({})
class FoodHistoryPage extends Vue {

    // First day of the month shown
    month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    items: any[] = [];
    loading = false;
    request = 0;

    created() {
        this.load();
    }

    get monthLabel(): string {
        return this.month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }

    // Monday first, with the narrow names of the weekdays of the language
    get weekdays(): string[] {
        return Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' }).toUpperCase());
    }

    get canNext(): boolean {
        const now = new Date();
        return this.month.getFullYear() * 12 + this.month.getMonth() < now.getFullYear() * 12 + now.getMonth();
    }

    shiftMonth(n: number) {
        if (n > 0 && !this.canNext) return;
        this.month = new Date(this.month.getFullYear(), this.month.getMonth() + n, 1);
        this.load();
    }

    load() {
        const y = this.month.getFullYear(), m = this.month.getMonth();
        const from = `${y}-${pad(m + 1)}-01`;
        const to = `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}`;
        this.request += 1;
        const id = this.request;
        this.loading = true;
        // Today's burned calories are saved when the day is calculated: do it first, so today is in the list too
        const now = new Date();
        const current = y === now.getFullYear() && m === now.getMonth();
        (current ? loadEnergyDay().catch(() => {}) : Promise.resolve())
        .then(() => http.get('/nutrition/history').data({ from, to }))
        .then((res: any) => { if (id === this.request) this.items = res.items ?? []; })
        .catch(() => App.notification(translate.get('nutrition.errors.load')).setType('error').show())
        .finally(() => { if (id === this.request) this.loading = false; });
    }

    // Did the day end inside the eating goal saved for it? (days with nothing eaten are not judged)
    stateOf(h: any): 'ok' | 'over' | 'low' | 'none' {
        const e = h?.energy;
        if (!e || e.goal_min == null || !h.kcal) return 'none';
        if (h.kcal > e.goal_max) return 'over';
        return h.kcal >= e.goal_min ? 'ok' : 'low';
    }

    get cells(): (Cell | null)[] {
        const y = this.month.getFullYear(), m = this.month.getMonth();
        const days = new Date(y, m + 1, 0).getDate();
        const lead = (new Date(y, m, 1).getDay() + 6) % 7;
        const byDate = new Map<string, any>(this.items.map((h: any) => [String(h.date).slice(0, 10), h]));
        const today = localDate();

        const out: (Cell | null)[] = Array.from({ length: lead }, () => null);
        for (let d = 1; d <= days; d++) {
            const date = `${y}-${pad(m + 1)}-${pad(d)}`;
            const h = byDate.get(date);
            out.push({ date, day: d, kcal: h?.kcal ?? 0, state: this.stateOf(h), today: date === today, future: date > today });
        }
        return out;
    }

    // The days of the month with something logged or burned, newest first: eaten, burned, protein and the balance
    get rows(): Row[] {
        const today = localDate();
        return this.items
            .filter((h: any) => h.kcal > 0 || h.energy)
            .map((h: any): Row => {
                const date = String(h.date).slice(0, 10);
                const [y, mo, d] = date.split('-').map(Number);
                const burned = h.energy ? Number(h.energy.burned) : null;
                return {
                    date,
                    label: new Date(y, mo - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
                    eaten: h.kcal ?? 0,
                    burned,
                    protein: Math.round(h.protein_g ?? 0),
                    // A day with nothing logged is not a deficit: it is not counted
                    balance: burned !== null && h.kcal > 0 ? h.kcal - burned : null,
                    today: date === today,
                };
            })
            .sort((a: Row, b: Row) => b.date.localeCompare(a.date));
    }

    // Days with food logged, the averages over them, and the days that reached the minimum protein (null without the data for the goal)
    get summary(): { logged: number; avgKcal: number; avgProtein: number; proteinDays: number | null } {
        const logged = this.items.filter((h: any) => h.kcal > 0);
        if (!logged.length) return { logged: 0, avgKcal: 0, avgProtein: 0, proteinDays: null };

        const avg = (key: string) => Math.round(logged.reduce((s: number, h: any) => s + (Number(h[key]) || 0), 0) / logged.length);
        const goalOf = (h: any) => h.energy?.goal ?? userStore.data?.goal ?? 'maintain';
        let reached = 0;
        let known = false;
        for (const h of logged) {
            const g = proteinRange(userStore.data, goalOf(h));
            if (!g) continue;
            known = true;
            if ((h.protein_g ?? 0) >= g.min) reached++;
        }
        return { logged: logged.length, avgKcal: avg('kcal'), avgProtein: avg('protein_g'), proteinDays: known ? reached : null };
    }

    openDay(date: string) {
        this.$router.push({ path: '/nutrition', query: { date } });
    }
}
export default toNative(FoodHistoryPage);
