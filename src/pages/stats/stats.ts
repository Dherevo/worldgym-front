import { Component, Vue, Watch, toNative } from "vue-facing-decorator";
import { http, translate } from "lib";
import { Chart, registerables } from 'chart.js';
import SectionTile from "@/components/section-tile/section-tile.vue";

Chart.register(...registerables);

// Chart.js instances must not be reactive (Vue would wrap them in proxies)
const charts: Record<string, Chart | null> = { time: null };

// Home of the stats: hours trained (chart + streaks), the last workout and the shortcuts to the other screens
@Component({ components: { SectionTile } })
class StatsPage extends Vue {

    // Hours trained: chart of the chosen period + streaks
    timeData: any = null;

    loadingTime = false;

    period = 'month';

    readonly periods = [
        { key: 'week', label: 'week' },
        { key: 'month', label: 'month' },
        { key: '3m', label: 'threeMonths' },
        { key: 'year', label: 'year' },
        { key: 'all', label: 'all' },
    ];

    lastOpen = false;

    // Overview (last workouts and calendar)
    overview: any = null;

    lastIndex = 0;

    summaries: Record<number, any> = {};

    loadingOverview = false;

    get dateLocale() {
        const l = translate.currentLanguage;
        return l === 'es' ? 'es-ES' : l === 'en' ? 'en-GB' : 'ca-ES';
    }

    isoDate(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    fetchTime() {
        this.loadingTime = true;
        http.get('/stats/training-time')
        .then((res: any) => { this.timeData = res; })
        .catch(() => { this.timeData = { sessions: [], streak: { current_weeks: 0, best_weeks: 0 } }; })
        .finally(() => {
            this.loadingTime = false;
            this.$nextTick(() => this.renderTimeChart());
        });
    }

    @Watch('period')
    onPeriod() {
        this.$nextTick(() => this.renderTimeChart());
    }

    // Monday of the week of a date
    weekStart(d: Date): Date {
        const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
        return x;
    }

    // Bars of the chosen period: by day (week), by week (month, 3 months), by month (year, all; by year when it spans 3+ years)
    get timeBars(): { label: string; seconds: number }[] {
        const sessions: { date: string; seconds: number }[] = this.timeData?.sessions ?? [];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let from: Date;
        let to: Date = today;
        let unit: 'day' | 'week' | 'month' | 'year' = 'week';
        if (this.period === 'week') { from = this.weekStart(today); to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6); unit = 'day'; }
        else if (this.period === 'month') { from = new Date(now.getFullYear(), now.getMonth(), 1); }
        else if (this.period === '3m') { from = new Date(now.getFullYear(), now.getMonth() - 2, 1); }
        else if (this.period === 'year') { from = new Date(now.getFullYear(), 0, 1); to = new Date(now.getFullYear(), 11, 31); unit = 'month'; }
        else {
            const first = sessions[0] ? new Date(sessions[0].date + 'T00:00:00') : today;
            from = new Date(first.getFullYear(), first.getMonth(), 1);
            unit = today.getFullYear() - from.getFullYear() >= 3 ? 'year' : 'month';
            if (unit === 'year') from = new Date(from.getFullYear(), 0, 1);
        }

        // Start of the bar a date belongs to
        const startOf = (d: Date): Date => {
            if (unit === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate());
            if (unit === 'week') return this.weekStart(d);
            if (unit === 'month') return new Date(d.getFullYear(), d.getMonth(), 1);
            return new Date(d.getFullYear(), 0, 1);
        };
        const next = (d: Date): Date => {
            if (unit === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
            if (unit === 'week') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
            if (unit === 'month') return new Date(d.getFullYear(), d.getMonth() + 1, 1);
            return new Date(d.getFullYear() + 1, 0, 1);
        };

        const bars = new Map<string, { label: string; seconds: number }>();
        for (let d = startOf(from); d <= to; d = next(d)) {
            bars.set(this.isoDate(d), { label: this.barLabel(d, unit), seconds: 0 });
        }
        const lowest = this.isoDate(from);
        const highest = this.isoDate(to);
        for (const s of sessions) {
            if (s.date < lowest || s.date > highest) continue;
            const bar = bars.get(this.isoDate(startOf(new Date(s.date + 'T00:00:00'))));
            if (bar) bar.seconds += s.seconds;
        }
        return [...bars.values()];
    }

    barLabel(d: Date, unit: string): string {
        if (unit === 'day') return d.toLocaleDateString(this.dateLocale, { weekday: 'short' });
        if (unit === 'week') return d.toLocaleDateString(this.dateLocale, { day: 'numeric', month: 'short' });
        if (unit === 'month') return d.toLocaleDateString(this.dateLocale, { month: 'short' });
        return String(d.getFullYear());
    }

    // 4 h 20 min
    formatDuration(seconds: number): string {
        const mins = Math.round(seconds / 60);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h === 0) return `${m} min`;
        return m === 0 ? `${h} h` : `${h} h ${m} min`;
    }

    get totalLabel(): string {
        return this.formatDuration(this.timeBars.reduce((sum, b) => sum + b.seconds, 0));
    }

    renderTimeChart() {
        charts.time?.destroy();
        charts.time = null;

        const canvas = this.$refs.timeCanvas as HTMLCanvasElement | undefined;
        const bars = this.timeBars;
        if (!canvas || !bars.length) return;

        const primary = this.cssVar('--primary-color', '#ED7334');
        Chart.defaults.color = this.cssVar('--text-secondary', '#888');
        const grid = this.cssVar('--border-color', 'rgba(128, 128, 128, 0.25)');

        charts.time = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: bars.map(b => b.label),
                datasets: [{
                    data: bars.map(b => Math.round((b.seconds / 3600) * 100) / 100),
                    backgroundColor: primary,
                    borderRadius: 4,
                    maxBarThickness: 36,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (c: any) => this.formatDuration(c.parsed.y * 3600) } },
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: grid }, ticks: { callback: (v: any) => `${v} h` } },
                    x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
                }
            }
        });
    }

    // ---- Last workouts (browsed with arrows) ----

    // Header of the workout being shown (known as soon as the overview arrives)
    get lastMeta(): any {
        return this.overview?.last_workouts?.[this.lastIndex] ?? {};
    }

    // Summary of the workout being shown: the latest one comes with the overview, the others are loaded on demand
    get lw(): any {
        if (this.lastIndex === 0) return this.overview?.last_workout ?? null;
        return this.summaries[this.lastMeta.id] ?? null;
    }

    selectLast(i: number) {
        const list = this.overview?.last_workouts ?? [];
        if (i < 0 || i >= list.length) return;
        this.lastIndex = i;
        if (i === 0 || this.summaries[list[i].id]) return;

        const id = list[i].id;
        http.get(`/stats/workouts/${id}`)
        .then((res: any) => { this.summaries = { ...this.summaries, [id]: res }; })
        .catch(() => {});
    }

    // "+5 kg" / "+1 sèrie" of an exercise of the last workout against the last time it was done
    lastChanges(e: any): { text: string; cls: string }[] {
        return this.sessionChanges({ max_weight: e.max_weight, total_sets: e.sets }, { max_weight: e.prev_max_weight, total_sets: e.prev_sets });
    }

    // How many of the exercises that had a previous time got better (heavier, or the same weight with more sets)
    get improvement(): { up: number; comparable: number } {
        const exercises = (this.lw?.exercises ?? []).filter((e: any) => e.prev_max_weight !== null);
        const up = exercises.filter((e: any) => this.lastChanges(e)[0]?.cls === 'up').length;
        return { up, comparable: exercises.length };
    }

    // What the last workout was compared with: the same routine day, the same muscle groups, or each exercise on its own
    comparedText(lw: any): string {
        if (lw.compared_with === 'day') {
            return translate.get('stats.dash2.vsDay', { day: lw.day_name, date: this.formatShortDate(lw.prev_date) });
        }
        if (lw.compared_with === 'groups') {
            return translate.get('stats.dash2.vsGroups', { groups: (lw.compared_groups ?? []).join(' + '), date: this.formatShortDate(lw.prev_date) });
        }
        return translate.get('stats.dash.last.vsExercises');
    }

    cssVar(name: string, fallback: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    }

    // What changed since the previous session: heaviest weight and number of sets
    sessionChanges(current: any, previous: any): { text: string; cls: string }[] {
        if (!current || !previous) return [];

        const signed = (n: number) => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;
        const cls = (n: number) => (n > 0 ? 'up' : 'down');
        const out: { text: string; cls: string }[] = [];

        const kg = Math.round((parseFloat(current.max_weight) - parseFloat(previous.max_weight)) * 10) / 10;
        if (kg !== 0) out.push({ text: `${signed(kg)} kg`, cls: cls(kg) });

        const sets = (current.total_sets ?? 0) - (previous.total_sets ?? 0);
        if (sets !== 0) {
            const unit = translate.get(Math.abs(sets) === 1 ? 'stats.dash2.progress.setOne' : 'stats.dash2.progress.setMany');
            out.push({ text: `${signed(sets)} ${unit}`, cls: cls(sets) });
        }
        return out;
    }

    formatHistoryDate(date: string) {
        return new Date(date).toLocaleDateString(this.dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
    }

    formatShortDate(date: string | null) {
        return date ? new Date(date).toLocaleDateString(this.dateLocale, { day: 'numeric', month: 'short' }) : '';
    }

    created() {
        this.fetchOverview();
        this.fetchTime();
    }

    beforeUnmount() {
        charts.time?.destroy();
    }

    fetchOverview() {
        this.loadingOverview = true;
        http.get('/stats/overview')
        .then((res: any) => { this.overview = res; })
        .catch(() => {})
        .finally(() => { this.loadingOverview = false; });
    }
}
export default toNative(StatsPage);
