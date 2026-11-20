import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

interface Row { label: string; value: string; delta: string; trend: 'up' | 'down' | 'same' | ''; }

// Summary of a week (the Sunday notification opens it) against the previous one
@Component({})
class WeeklySummaryPage extends Vue {

    loading = true;
    data: any = null;
    // Weeks away from this one (0 = this week, -1 = last week)
    offset = 0;

    created() {
        this.load();
    }

    // Any day of the wanted week, as Y-m-d
    get date(): string {
        const d = new Date();
        d.setDate(d.getDate() + this.offset * 7);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    load() {
        this.loading = true;
        http.get('/summary/weekly').data({ date: this.date })
        .then((res: any) => { this.data = res; })
        .catch(() => App.notification(translate.get('weekly.error')).setType('error').show())
        .finally(() => { this.loading = false; });
    }

    move(weeks: number) {
        if (this.offset + weeks > 0) return;
        this.offset += weeks;
        this.load();
    }

    get title(): string {
        if (!this.data) return '';
        if (this.offset === 0) return translate.get('weekly.thisWeek');
        const f = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
        return `${f(this.data.week_start)} – ${f(this.data.week_end)}`;
    }

    // "+3", "-120" against the previous week; empty when one of the two has no value
    private delta(cur: number | null, prev: number | null, unit = '', goodWhenUp = true): { delta: string; trend: Row['trend'] } {
        if (cur === null || prev === null) return { delta: '', trend: '' };
        const diff = Math.round((cur - prev) * 10) / 10;
        if (diff === 0) return { delta: '=', trend: 'same' };
        const better = (diff > 0) === goodWhenUp;
        return { delta: `${diff > 0 ? '+' : ''}${diff}${unit}`, trend: better ? 'up' : 'down' };
    }

    private row(label: string, cur: number | null, prev: number | null, unit = '', goodWhenUp = true, format?: (n: number) => string): Row {
        const d = this.delta(cur, prev, unit, goodWhenUp);
        const text = cur === null ? '—' : (format ? format(cur) : String(cur)) + unit;
        return { label: translate.get(label), value: text, delta: d.delta, trend: d.trend };
    }

    get training(): Row[] {
        if (!this.data) return [];
        const c = this.data.current, p = this.data.previous;
        const rows = [
            this.row('weekly.workouts', c.workouts, p.workouts),
            this.row('weekly.sets', c.sets, p.sets),
            this.row('weekly.volume', c.volume_kg, p.volume_kg, ' kg', true, n => n.toLocaleString()),
        ];
        if (c.routine_days > 0) {
            rows.splice(1, 0, { label: translate.get('weekly.routineDays'), value: `${c.routine_days_done}/${c.routine_days}`, delta: '', trend: '' });
        }
        return rows;
    }

    get food(): Row[] {
        if (!this.data) return [];
        const c = this.data.current, p = this.data.previous;
        return [
            this.row('weekly.daysLogged', c.days_logged, p.days_logged),
            this.row('weekly.avgKcal', c.avg_kcal, p.avg_kcal, ' kcal', false, n => n.toLocaleString()),
            this.row('weekly.avgProtein', c.avg_protein_g, p.avg_protein_g, ' g'),
            {
                label: translate.get('weekly.proteinDays', { min: this.data.protein_min ?? '?' }),
                value: c.days_logged ? `${c.protein_days}/${c.days_logged}` : '—',
                delta: '', trend: '',
            },
            this.row('weekly.balance', c.avg_balance_kcal, p.avg_balance_kcal, ' kcal', false, n => (n > 0 ? '+' : '') + n.toLocaleString()),
        ];
    }

    get body(): Row[] {
        if (!this.data) return [];
        const c = this.data.current, p = this.data.previous;
        const rows = [this.row('weekly.steps', c.avg_steps, p.avg_steps, '', true, n => n.toLocaleString())];
        if (c.weight_kg !== null) {
            rows.push({
                label: translate.get('weekly.weight'),
                value: `${c.weight_kg} kg`,
                delta: c.weight_change_kg === null ? '' : `${c.weight_change_kg > 0 ? '+' : ''}${c.weight_change_kg} kg`,
                trend: '',
            });
        }
        return rows;
    }
}
export default toNative(WeeklySummaryPage);
