import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, translate } from "lib";
import { Chart, registerables } from 'chart.js';
import SectionTile from "@/components/section-tile/section-tile.vue";

Chart.register(...registerables);

// Chart.js instances must not be reactive (Vue would wrap them in proxies)
const charts: Record<string, Chart | null> = { monthly: null, group: null, weight: null, volume: null, reps: null };

@Component({ components: { SectionTile } })
class StatsPage extends Vue {

    // Overview (the totals follow the selected range)
    overview: any = null;
    lastIndex = 0;
    summaries: Record<number, any> = {};
    loadingOverview = false;
    range = 'month';
    readonly ranges = [
        { key: 'month', label: 'month' },
        { key: '3m', label: 'threeMonths' },
        { key: 'year', label: 'year' },
        { key: 'all', label: 'all' },
    ];

    // Calendar: current month + the whole year in a modal
    calMonthOffset = 0;
    showYear = false;
    heatmapWeeks: any[] = [];

    // Monthly trend (collapsed until opened)
    monthlyOpen = false;

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

    created() {
        this.fetchOverview();
        this.fetchMuscleGroups();
    }

    beforeUnmount() {
        [charts.monthly, charts.group, charts.weight, charts.volume, charts.reps].forEach(c => c?.destroy());
    }

    // ---- Overview ----

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

    fetchOverview() {
        this.loadingOverview = true;
        const params: any = {};
        const from = this.rangeFrom(this.range);
        if (from) params.from = from;
        http.get('/stats/overview').data(params)
        .then((res: any) => {
            this.overview = res;
            this.buildHeatmap();
            this.initGroup();
            if (this.monthlyOpen) setTimeout(() => { this.renderMonthlyChart(); }, 0);
        })
        .catch(() => {})
        .finally(() => { this.loadingOverview = false; });
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

    // ---- Calendar ----

    get weekdayLabels(): string[] {
        // 2024-01-01 was a Monday
        return [0, 1, 2, 3, 4, 5, 6].map(i => new Date(2024, 0, 1 + i).toLocaleDateString(this.dateLocale, { weekday: 'narrow' }));
    }

    get calendarMonth() {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth() + this.calMonthOffset, 1);
        const y = first.getFullYear();
        const m = first.getMonth();

        const counts: Record<string, number> = {};
        for (const c of this.overview?.calendar ?? []) counts[c.date] = c.count;

        const todayKey = this.isoDate(now);
        const lead = (first.getDay() + 6) % 7; // Monday first
        const days = new Date(y, m + 1, 0).getDate();
        const cells: any[] = [];
        let trained = 0;
        for (let i = 0; i < lead; i++) cells.push(null);
        for (let d = 1; d <= days; d++) {
            const key = this.isoDate(new Date(y, m, d));
            const count = counts[key] ?? 0;
            if (count > 0) trained++;
            cells.push({ day: d, date: key, count, level: count === 0 ? 0 : Math.min(3, count + 1), today: key === todayKey, future: key > todayKey });
        }

        const label = first.toLocaleDateString(this.dateLocale, { month: 'long', year: 'numeric' });
        return { label: label.charAt(0).toUpperCase() + label.slice(1), cells, trained };
    }

    // The calendar data covers the last 53 weeks
    get canGoBack(): boolean {
        const from = this.overview?.calendar_from as string | undefined;
        if (!from) return false;
        const [y, m] = from.split('-').map(Number);
        const now = new Date();
        const target = new Date(now.getFullYear(), now.getMonth() + this.calMonthOffset - 1, 1);
        return target >= new Date(y, m - 1, 1);
    }

    // 53 week columns (Monday first) with the workouts of each day
    buildHeatmap() {
        const o = this.overview;
        if (!o?.calendar_from) { this.heatmapWeeks = []; return; }

        const counts: Record<string, number> = {};
        for (const c of o.calendar ?? []) counts[c.date] = c.count;

        const [y, m, d] = (o.calendar_from as string).split('-').map(Number);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weeks: any[] = [];
        let lastMonth = -1;
        for (let w = 0; w < 53; w++) {
            const first = new Date(y, m - 1, d + w * 7);
            const days: any[] = [];
            for (let i = 0; i < 7; i++) {
                const day = new Date(y, m - 1, d + w * 7 + i);
                if (day > today) { days.push(null); continue; }
                const key = this.isoDate(day);
                const n = counts[key] ?? 0;
                days.push({ date: key, count: n, level: n === 0 ? 0 : Math.min(3, n + 1) });
            }
            const label = first.getMonth() !== lastMonth ? first.toLocaleDateString(this.dateLocale, { month: 'short' }) : '';
            lastMonth = first.getMonth();
            weeks.push({ label, days });
        }
        this.heatmapWeeks = weeks;
    }

    // ---- Monthly trend ----

    cssVar(name: string, fallback: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    }

    monthLabel(ym: string): string {
        const [y, m] = ym.split('-').map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString(this.dateLocale, { month: 'short', year: '2-digit' });
    }

    // A chart can only be sized once its section is visible
    toggleMonthly() {
        this.monthlyOpen = !this.monthlyOpen;
        if (this.monthlyOpen) {
            setTimeout(() => { this.renderMonthlyChart(); }, 0);
        } else {
            charts.monthly?.destroy();
            charts.monthly = null;
        }
    }

    renderMonthlyChart() {
        charts.monthly?.destroy();
        charts.monthly = null;

        const monthly = this.overview?.monthly ?? [];
        const canvas = document.getElementById('monthlyCanvas') as HTMLCanvasElement | null;
        if (!canvas || !monthly.length) return;
        Chart.getChart(canvas)?.destroy();

        Chart.defaults.color = this.cssVar('--text-secondary', '#888');
        const grid = this.cssVar('--border-color', 'rgba(128, 128, 128, 0.25)');

        charts.monthly = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: monthly.map((m: any) => this.monthLabel(m.month)),
                datasets: [
                    {
                        type: 'bar',
                        label: translate.get('stats.dash.monthly.workouts'),
                        data: monthly.map((m: any) => m.workouts),
                        backgroundColor: 'rgba(237, 115, 52, 0.65)',
                        borderRadius: 4,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: translate.get('stats.dash2.monthlySets'),
                        data: monthly.map((m: any) => m.sets),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgb(59, 130, 246)',
                        borderWidth: 2,
                        pointRadius: 3,
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            } as any,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    y: { beginAtZero: true, grid: { color: grid }, ticks: { precision: 0 } },
                    y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { precision: 0 } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // ---- Progression ----

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
}
export default toNative(StatsPage);
