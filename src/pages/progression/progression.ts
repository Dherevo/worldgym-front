import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, translate } from "lib";
import { Chart, registerables } from 'chart.js';
import BackButton from "@/components/back-button/back-button.vue";
import { bucketize } from "@/modules/chartBuckets";

Chart.register(...registerables);

type ExMetric = 'weight' | 'volume' | 'reps';

// Chart.js instances must not be reactive (Vue would wrap them in proxies)
const charts: Record<string, Chart | null> = { group: null, exercise: null };

// Progression: muscle group (in a period) -> exercise -> last time, current and record
@Component({ components: { BackButton } })
class ProgressionPage extends Vue {

    // Overview (last workouts and calendar)
    overview: any = null;

    loadingOverview = false;

    // Period of the muscle group section (chart and exercises); 'custom' uses the two dates
    period = '3m';
    readonly periods = [
        { key: 'month', label: 'month' },
        { key: '3m', label: 'threeMonths' },
        { key: 'year', label: 'year' },
        { key: 'all', label: 'all' },
        { key: 'custom', label: 'custom' },
    ];
    customFrom = '';
    customTo = '';

    // One chart per opened exercise, with the metric chosen by chips (like the stats of Hevy)
    exMetric: ExMetric = 'weight';
    readonly exMetrics: ExMetric[] = ['weight', 'volume', 'reps'];

    // Progression: muscle group -> exercise -> previous / current / record
    muscleGroups: any[] = [];

    selectedMuscleGroupId: number | string = '';

    groupStats: any = null;

    loadingGroup = false;

    groupInitDone = false;

    openExerciseId: number | null = null;

    loadingExerciseId: number | null = null;

    exerciseDetail: Record<number, any> = {};

    get dateLocale() {
        const l = translate.currentLanguage;
        return l === 'es' ? 'es-ES' : l === 'en' ? 'en-GB' : 'ca-ES';
    }

    isoDate(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // First day of each range ('' = everything)
    rangeFrom(key: string): string {
        const now = new Date();
        if (key === 'month') return this.isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
        if (key === '3m') return this.isoDate(new Date(now.getFullYear(), now.getMonth() - 2, 1));
        if (key === 'year') return this.isoDate(new Date(now.getFullYear(), 0, 1));
        return '';
    }

    // from/to of the chosen period ('' = no limit)
    periodParams(): { from?: string; to?: string } {
        if (this.period === 'custom') {
            const p: { from?: string; to?: string } = {};
            if (this.customFrom) p.from = this.customFrom;
            if (this.customTo) p.to = this.customTo;
            return p;
        }
        const from = this.rangeFrom(this.period);
        return from ? { from } : {};
    }

    cssVar(name: string, fallback: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    }

    fetchMuscleGroups() {
        http.get('/muscle-groups?pageSize=500')
        .then((res: any) => {
            this.muscleGroups = res.items ?? [];
            this.initGroup();
        })
        .catch(() => {});
    }

    // Starts with the muscle group worked in the last session
    initGroup() {
        if (this.groupInitDone || !this.muscleGroups.length || !this.overview) return;
        this.groupInitDone = true;
        const id = this.overview.last_workout?.muscle_group_id ?? this.muscleGroups[0]?.id;
        if (!id) return;
        this.selectedMuscleGroupId = id;
        this.onGroupChange();
    }

    onGroupChange() {
        this.openExerciseId = null;
        this.groupStats = null;
        if (!this.selectedMuscleGroupId) return;

        this.loadingGroup = true;
        charts.group?.destroy();
        charts.group = null;
        this.destroyExerciseCharts();
        http.get(`/stats/muscle-groups/${this.selectedMuscleGroupId}`).data(this.periodParams())
        .then((res: any) => {
            this.groupStats = res;
            setTimeout(() => { this.renderGroupChart(); }, 0);
        })
        .catch(() => {})
        .finally(() => { this.loadingGroup = false; });
    }

    toggleExercise(ex: any) {
        this.destroyExerciseCharts();
        if (this.openExerciseId === ex.id) { this.openExerciseId = null; return; }
        this.openExerciseId = ex.id;
        if (this.exerciseDetail[ex.id]) {
            setTimeout(() => { this.renderExerciseCharts(ex.id); }, 0);
            return;
        }

        this.loadingExerciseId = ex.id;
        Promise.all([
            http.get(`/stats/exercises/${ex.id}`).then((r: any) => r).catch(() => null),
            http.get(`/stats/exercises/${ex.id}/pr`).then((r: any) => r).catch(() => null),
        ])
        .then(([stats, pr]: any[]) => {
            this.exerciseDetail = { ...this.exerciseDetail, [ex.id]: { sessions: stats?.sessions ?? [], pr } };
        })
        .finally(() => {
            this.loadingExerciseId = null;
            setTimeout(() => { this.renderExerciseCharts(ex.id); }, 0);
        });
    }

    get selectedGroupName(): string {
        return this.muscleGroups.find((g: any) => g.id === Number(this.selectedMuscleGroupId))?.name ?? '';
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

    // The cards show the last session, the one before and the record; the charts show the whole evolution
    exerciseView(id: number): any {
        const d = this.exerciseDetail[id];
        if (!d) return null;

        const sessions = d.sessions ?? [];
        const current = sessions.at(-1) ?? null;
        const previous = sessions.length > 1 ? sessions.at(-2) : null;
        return { current, previous, pr: d.pr, changes: this.sessionChanges(current, previous), sessionCount: sessions.length };
    }

    // "Ara 60 kg · Màxim 65 kg": the figures of a chart written next to it
    // The period shown as dates ('all' starts at the first record)
    periodRange(firstDate?: string): { from: Date; to: Date } {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const to = this.period === 'custom' && this.customTo ? new Date(this.customTo + 'T00:00:00') : today;
        const fromStr = this.periodParams().from ?? firstDate;
        const from = fromStr ? new Date(fromStr + 'T00:00:00') : new Date(today.getFullYear(), today.getMonth() - 2, 1);
        return { from: from > to ? to : from, to };
    }

    // Volume of the muscle group by week (by month in long periods)
    get groupBars() {
        const sessions: any[] = this.groupStats?.sessions ?? [];
        if (!sessions.length) return [];
        const { from, to } = this.periodRange(sessions[0].date);
        return bucketize(sessions.map(s => ({ date: s.date, value: parseFloat(s.total_volume) })), from, to, 'sum', this.dateLocale);
    }

    // Bars of an exercise for the chosen metric: heaviest weight of the week, or the volume / reps added up
    exBars(id: number, kind: ExMetric) {
        const sessions: any[] = this.exerciseDetail[id]?.sessions ?? [];
        if (!sessions.length) return [];
        const { from, to } = this.periodRange(sessions[0].date);
        const lowest = this.isoDate(from);
        const highest = this.isoDate(to);
        const pick = (s: any) => parseFloat(kind === 'weight' ? s.max_weight : kind === 'volume' ? s.total_volume : s.total_reps);
        const rows = sessions.filter(s => s.date >= lowest && s.date <= highest).map(s => ({ date: s.date, value: pick(s) }));
        return bucketize(rows, from, to, kind === 'weight' ? 'max' : 'sum', this.dateLocale);
    }

    formatBar(kind: ExMetric, n: number): string {
        return kind === 'weight' ? `${n} kg` : kind === 'volume' ? this.formatVolume(n) : String(Math.round(n));
    }

    // "Now 60 kg · Max 65 kg": the last and the best bar with data
    chartValues(id: number): string {
        const bars = this.exBars(id, this.exMetric).filter(b => b.value > 0);
        if (!bars.length) return '';
        const now = bars[bars.length - 1].value;
        const best = Math.max(...bars.map(b => b.value));
        return `${translate.get('stats.dash2.progress.now')} ${this.formatBar(this.exMetric, now)} · ${translate.get('stats.dash2.progress.max')} ${this.formatBar(this.exMetric, best)}`;
    }

    setExMetric(kind: ExMetric) {
        this.exMetric = kind;
        if (this.openExerciseId !== null) this.$nextTick(() => this.renderExerciseCharts(this.openExerciseId as number));
    }

    destroyExerciseCharts() {
        charts.exercise?.destroy();
        charts.exercise = null;
    }

    baseChartOptions(): any {
        Chart.defaults.color = this.cssVar('--text-secondary', '#888');
        const grid = this.cssVar('--border-color', 'rgba(128, 128, 128, 0.25)');
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: grid } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } }
            }
        };
    }

    barChart(canvas: HTMLCanvasElement, bars: { label: string; value: number }[], color: string, format: (n: number) => string): Chart {
        Chart.getChart(canvas)?.destroy();
        const options = this.baseChartOptions();
        options.plugins.tooltip = { callbacks: { label: (c: any) => format(c.parsed.y) } };
        return new Chart(canvas, {
            type: 'bar',
            data: {
                labels: bars.map(b => b.label),
                datasets: [{ data: bars.map(b => b.value), backgroundColor: color, borderRadius: 4, maxBarThickness: 36 }]
            },
            options
        });
    }

    // Volume of the muscle group by week (or month)
    renderGroupChart() {
        charts.group?.destroy();
        charts.group = null;

        const bars = this.groupBars;
        const canvas = document.getElementById('groupVolumeCanvas') as HTMLCanvasElement | null;
        if (!canvas || !bars.length) return;
        charts.group = this.barChart(canvas, bars, this.cssVar('--primary-color', '#ED7334'), n => this.formatVolume(n));
    }

    // The opened exercise: one chart, the metric chosen by the chips
    renderExerciseCharts(id: number, tries = 8) {
        this.destroyExerciseCharts();
        if (this.openExerciseId !== id) return;

        const canvas = document.getElementById('exerciseCanvas') as HTMLCanvasElement | null;
        if (!canvas) {
            if (tries > 0) setTimeout(() => { this.renderExerciseCharts(id, tries - 1); }, 40);
            return;
        }
        const kind = this.exMetric;
        const bars = this.exBars(id, kind);
        if (!bars.length) return;
        charts.exercise = this.barChart(canvas, bars, this.cssVar('--primary-color', '#ED7334'), n => this.formatBar(kind, n));
    }

    // ---- Formatting ----

    formatVolume(v: number | string) {
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return n >= 1000 ? (n / 1000).toFixed(1) + ' t' : Math.round(n) + ' kg';
    }

    formatHistoryDate(date: string) {
        return new Date(date).toLocaleDateString(this.dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
    }

    formatShortDate(date: string | null) {
        return date ? new Date(date).toLocaleDateString(this.dateLocale, { day: 'numeric', month: 'short' }) : '';
    }

    created() {
        this.fetchOverview();
        this.fetchMuscleGroups();
    }

    beforeUnmount() {
        [charts.group, charts.exercise].forEach(c => c?.destroy());
    }

    fetchOverview() {
        http.get('/stats/overview')
        .then((res: any) => {
            this.overview = res;
            this.initGroup();
        })
        .catch(() => {});
    }

    goBack() {
        if (window.history.state?.back) this.back();
        else this.to('/stats');
    }
}
export default toNative(ProgressionPage);
