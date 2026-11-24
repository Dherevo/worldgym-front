import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, translate } from "lib";
import { Chart, registerables } from 'chart.js';
import BackButton from "@/components/back-button/back-button.vue";

Chart.register(...registerables);

// Chart.js instances must not be reactive (Vue would wrap them in proxies)
const charts: Record<string, Chart | null> = { group: null, weight: null, volume: null, reps: null };

// Progression: totals of a range, then muscle group -> exercise -> last time, current and record
@Component({ components: { BackButton } })
class ProgressionPage extends Vue {

    // Overview (last workouts and calendar)
    overview: any = null;

    loadingOverview = false;

    range = 'month';

    readonly ranges = [
        { key: 'month', label: 'month' },
        { key: '3m', label: 'threeMonths' },
        { key: 'year', label: 'year' },
        { key: 'all', label: 'all' },
    ];

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

    setRange(key: string) {
        this.range = key;
        this.fetchOverview();
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
        http.get(`/stats/muscle-groups/${this.selectedMuscleGroupId}`)
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
    chartValues(id: number, kind: 'weight' | 'volume' | 'reps'): string {
        const sessions = this.exerciseDetail[id]?.sessions ?? [];
        if (!sessions.length) return '';

        const pick = (s: any) => parseFloat(kind === 'weight' ? s.max_weight : kind === 'volume' ? s.total_volume : s.avg_reps);
        const values = sessions.map(pick);
        const now = values[values.length - 1];
        const fmt = (n: number) => kind === 'weight' ? `${n} kg` : kind === 'volume' ? this.formatVolume(n) : n.toFixed(1);

        if (kind === 'reps') {
            const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
            return `${translate.get('stats.dash2.progress.now')} ${fmt(now)} · ${translate.get('stats.dash2.progress.average')} ${fmt(avg)}`;
        }
        return `${translate.get('stats.dash2.progress.now')} ${fmt(now)} · ${translate.get('stats.dash2.progress.max')} ${fmt(Math.max(...values))}`;
    }

    destroyExerciseCharts() {
        [charts.weight, charts.volume, charts.reps].forEach(c => c?.destroy());
        charts.weight = charts.volume = charts.reps = null;
    }

    dateLabels(rows: any[]): string[] {
        return rows.map((r: any) => new Date(r.date).toLocaleDateString(this.dateLocale, { month: 'short', year: '2-digit' }));
    }

    baseChartOptions(): any {
        Chart.defaults.color = this.cssVar('--text-secondary', '#888');
        const grid = this.cssVar('--border-color', 'rgba(128, 128, 128, 0.25)');
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, grid: { color: grid } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } }
            }
        };
    }

    // Volume of every session of the muscle group over the years
    renderGroupChart() {
        charts.group?.destroy();
        charts.group = null;

        const sessions = this.groupStats?.sessions ?? [];
        const canvas = document.getElementById('groupVolumeCanvas') as HTMLCanvasElement | null;
        if (!canvas || !sessions.length) return;
        Chart.getChart(canvas)?.destroy();

        const options = this.baseChartOptions();
        options.scales.y.beginAtZero = true;
        charts.group = new Chart(canvas, {
            type: 'line',
            data: {
                labels: this.dateLabels(sessions),
                datasets: [{
                    label: translate.get('stats.charts.volumeLabel'),
                    data: sessions.map((s: any) => parseFloat(s.total_volume)),
                    borderColor: 'rgb(237, 115, 52)',
                    backgroundColor: 'rgba(237, 115, 52, 0.12)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.25,
                    fill: true
                }]
            },
            options
        });
    }

    // Max weight, volume and average reps of the exercise in every session
    renderExerciseCharts(id: number, tries = 8) {
        this.destroyExerciseCharts();
        if (this.openExerciseId !== id) return;

        const sessions = this.exerciseDetail[id]?.sessions ?? [];
        if (sessions.length < 2) return;

        if (!document.getElementById('weightCanvas')) {
            if (tries > 0) setTimeout(() => { this.renderExerciseCharts(id, tries - 1); }, 40);
            return;
        }

        const labels = this.dateLabels(sessions);
        const line = (canvasId: string, label: string, data: number[], color: string, rgba: string, zero = false) => {
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
            if (!canvas) return null;
            Chart.getChart(canvas)?.destroy();
            const options = this.baseChartOptions();
            options.scales.y.beginAtZero = zero;
            return new Chart(canvas, {
                type: 'line',
                data: { labels, datasets: [{ label, data, borderColor: color, backgroundColor: rgba, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.25, fill: true }] },
                options
            });
        };

        charts.weight = line('weightCanvas', translate.get('stats.charts.maxWeightLabel'), sessions.map((h: any) => parseFloat(h.max_weight)), 'rgb(237, 115, 52)', 'rgba(237, 115, 52, 0.12)');
        charts.volume = line('volumeCanvas', translate.get('stats.charts.volumeLabel'), sessions.map((h: any) => parseFloat(h.total_volume)), 'rgb(34, 197, 94)', 'rgba(34, 197, 94, 0.12)', true);
        charts.reps = line('repsCanvas', translate.get('stats.charts.avgRepsLabel'), sessions.map((h: any) => parseFloat(h.avg_reps)), 'rgb(59, 130, 246)', 'rgba(59, 130, 246, 0.12)');
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
        [charts.group, charts.weight, charts.volume, charts.reps].forEach(c => c?.destroy());
    }

    fetchOverview() {
        this.loadingOverview = true;
        const params: any = {};
        const from = this.rangeFrom(this.range);
        if (from) params.from = from;
        http.get('/stats/overview').data(params)
        .then((res: any) => {
            this.overview = res;
            this.initGroup();
        })
        .catch(() => {})
        .finally(() => { this.loadingOverview = false; });
    }

    goBack() {
        if (window.history.state?.back) this.back();
        else this.to('/stats');
    }
}
export default toNative(ProgressionPage);
