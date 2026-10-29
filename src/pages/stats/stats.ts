import { Component, Vue, toNative, Watch } from "vue-facing-decorator";
import { http, translate } from "lib";
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({})
class StatsPage extends Vue {

    // Overview
    overview: any = null;
    loadingOverview = false;
    overviewFrom = '';
    overviewTo = '';
    readonly ranges = [
        { key: 'month', label: 'month' },
        { key: '3m', label: 'threeMonths' },
        { key: 'year', label: 'year' },
        { key: 'all', label: 'all' },
    ];
    heatmapWeeks: any[] = [];
    monthlyChart: Chart | null = null;
    groupChart: Chart | null = null;
    firstLoad = true;

    // Exercise progression
    exercises: any[] = [];
    searchQuery = '';
    selectedExercise: any = null;
    exerciseStats: any = null;
    exercisePr: any = null;
    loadingExerciseStats = false;
    showDropdown = false;

    // Muscle group
    muscleGroups: any[] = [];
    selectedMuscleGroupId = '';
    muscleGroupStats: any = null;
    loadingMgStats = false;

    // Charts
    weightChart: Chart | null = null;
    volumeChart: Chart | null = null;
    repsChart: Chart | null = null;
    mgVolumeChart: Chart | null = null;

    get dateLocale() {
        const l = translate.currentLanguage;
        return l === 'es' ? 'es-ES' : l === 'en' ? 'en-GB' : 'ca-ES';
    }

    get filteredExercises() {
        if (!this.searchQuery) return this.exercises.slice(0, 8);
        const q = this.searchQuery.toLowerCase();
        return this.exercises.filter(e => e.name.toLowerCase().includes(q)).slice(0, 8);
    }

    created() {
        this.fetchOverview();
        this.fetchExercises();
        this.fetchMuscleGroups();
    }

    beforeUnmount() {
        this.weightChart?.destroy();
        this.volumeChart?.destroy();
        this.repsChart?.destroy();
        this.mgVolumeChart?.destroy();
        this.monthlyChart?.destroy();
        this.groupChart?.destroy();
    }

    fetchOverview() {
        this.loadingOverview = true;
        const params: any = {};
        if (this.overviewFrom) params.from = this.overviewFrom;
        if (this.overviewTo) params.to = this.overviewTo;
        http.get('/stats/overview').data(params)
        .then((res: any) => {
            this.overview = res;
            this.buildHeatmap();
            setTimeout(() => { this.renderOverviewCharts(); }, 0);
            this.preselectLastExercise();
        })
        .catch(() => {})
        .finally(() => { this.loadingOverview = false; });
    }

    fetchExercises() {
        http.get('/exercises?pageSize=2000')
        .then((res: any) => { this.exercises = res.items ?? []; })
        .catch(() => {});
    }

    fetchMuscleGroups() {
        http.get('/muscle-groups?pageSize=500')
        .then((res: any) => { this.muscleGroups = res.items ?? []; })
        .catch(() => {});
    }

    hideDropdown() {
        setTimeout(() => { this.showDropdown = false; }, 150);
    }

    selectExercise(ex: any) {
        this.selectedExercise = ex;
        this.searchQuery = ex.name;
        this.showDropdown = false;
        this.loadExerciseStats(ex.id);
    }

    @Watch('exerciseStats')
    onExerciseStatsChanged(val: any) {
        if (val) {
            setTimeout(() => { this.renderExerciseCharts(); }, 0);
        }
    }

    @Watch('muscleGroupStats')
    onMuscleGroupStatsChanged(val: any) {
        if (val) {
            setTimeout(() => { this.renderMgChart(); }, 0);
        }
    }

    loadExerciseStats(id: number) {
        this.loadingExerciseStats = true;
        this.exerciseStats = null;
        this.exercisePr = null;
        this.weightChart?.destroy();
        this.volumeChart?.destroy();
        this.repsChart?.destroy();
        this.weightChart = null;
        this.volumeChart = null;
        this.repsChart = null;

        http.get(`/stats/exercises/${id}`)
        .then((res: any) => { this.exerciseStats = res; })
        .catch(() => {})
        .finally(() => { this.loadingExerciseStats = false; });

        http.get(`/stats/exercises/${id}/pr`)
        .then((res: any) => { this.exercisePr = res; })
        .catch(() => {});
    }

    renderExerciseCharts() {
        const sessions = this.exerciseStats?.sessions ?? [];
        if (!sessions.length) return;

        const labels = sessions.map((h: any) =>
            new Date(h.date).toLocaleDateString(this.dateLocale, { day: 'numeric', month: 'short' })
        );

        const weightCanvas = document.getElementById('weightCanvas') as HTMLCanvasElement;
        if (weightCanvas) {
            this.weightChart = new Chart(weightCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: translate.get('stats.charts.maxWeightLabel'),
                        data: sessions.map((h: any) => parseFloat(h.max_weight)),
                        borderColor: 'rgb(237, 115, 52)',
                        backgroundColor: 'rgba(237, 115, 52, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgb(237, 115, 52)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: false, grid: { color: this.gridColor } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        const volumeCanvas = document.getElementById('volumeCanvas') as HTMLCanvasElement;
        if (volumeCanvas) {
            this.volumeChart = new Chart(volumeCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: translate.get('stats.charts.volumeLabel'),
                        data: sessions.map((h: any) => parseFloat(h.total_volume)),
                        backgroundColor: 'rgba(237, 115, 52, 0.6)',
                        borderColor: 'rgb(237, 115, 52)',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: this.gridColor } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        const repsCanvas = document.getElementById('repsCanvas') as HTMLCanvasElement;
        if (repsCanvas) {
            this.repsChart = new Chart(repsCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: translate.get('stats.charts.avgRepsLabel'),
                        data: sessions.map((h: any) => parseFloat(h.avg_reps)),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: false, grid: { color: this.gridColor } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    }

    onMuscleGroupChange() {
        if (!this.selectedMuscleGroupId) {
            this.muscleGroupStats = null;
            return;
        }
        this.loadingMgStats = true;
        this.muscleGroupStats = null;
        this.mgVolumeChart?.destroy();
        this.mgVolumeChart = null;

        http.get(`/stats/muscle-groups/${this.selectedMuscleGroupId}`)
        .then((res: any) => { this.muscleGroupStats = res; })
        .catch(() => {})
        .finally(() => { this.loadingMgStats = false; });
    }

    renderMgChart() {
        const sessions = this.muscleGroupStats?.sessions ?? [];
        if (!sessions.length) return;

        const labels = sessions.map((s: any) =>
            new Date(s.date).toLocaleDateString(this.dateLocale, { day: 'numeric', month: 'short' })
        );

        const mgCanvas = document.getElementById('mgVolumeCanvas') as HTMLCanvasElement;
        if (mgCanvas) {
            this.mgVolumeChart = new Chart(mgCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: translate.get('stats.charts.volumeLabel'),
                        data: sessions.map((s: any) => parseFloat(s.total_volume)),
                        backgroundColor: 'rgba(237, 115, 52, 0.6)',
                        borderColor: 'rgb(237, 115, 52)',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: this.gridColor } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    }

    // ---- Dashboard helpers ----

    cssVar(name: string, fallback: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    }

    get gridColor(): string {
        return this.cssVar('--border-color', 'rgba(128, 128, 128, 0.25)');
    }

    isoDate(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // First day of each quick range ('' = everything)
    rangeFrom(key: string): string {
        const now = new Date();
        if (key === 'month') return this.isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
        if (key === '3m') return this.isoDate(new Date(now.getFullYear(), now.getMonth() - 2, 1));
        if (key === 'year') return this.isoDate(new Date(now.getFullYear(), 0, 1));
        return '';
    }

    isRange(key: string): boolean {
        return !this.overviewTo && this.overviewFrom === this.rangeFrom(key);
    }

    setRange(key: string) {
        this.overviewTo = '';
        this.overviewFrom = this.rangeFrom(key);
        this.fetchOverview();
    }

    // The exercises section opens already loaded with an exercise of the last workout
    preselectLastExercise() {
        if (!this.firstLoad) return;
        this.firstLoad = false;
        const e = this.overview?.last_workout?.exercises?.[0];
        if (e && !this.selectedExercise) this.selectExercise({ id: e.id, name: e.name });
    }

    openExercise(e: any) {
        this.selectExercise({ id: e.id, name: e.name });
        setTimeout(() => { document.getElementById('progress-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
    }

    deltaText(n: number): string {
        return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n))}%`;
    }

    deltaClass(n: number | null): string {
        if (n === null || n === undefined) return 'flat';
        return n > 0 ? 'up' : n < 0 ? 'down' : 'flat';
    }

    // Volume of an exercise relative to the heaviest one of the workout
    barWidth(e: any): number {
        const max = Math.max(...(this.overview?.last_workout?.exercises ?? []).map((x: any) => x.volume_kg), 1);
        return Math.max(4, Math.round((e.volume_kg / max) * 100));
    }

    monthLabel(ym: string): string {
        const [y, m] = ym.split('-').map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString(this.dateLocale, { month: 'short', year: '2-digit' });
    }

    // 53 week columns (Monday first) with the number of workouts of each day
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
            const label = first.getMonth() !== lastMonth
                ? first.toLocaleDateString(this.dateLocale, { month: 'short' })
                : '';
            lastMonth = first.getMonth();
            weeks.push({ label, days });
        }
        this.heatmapWeeks = weeks;
    }

    renderOverviewCharts() {
        this.monthlyChart?.destroy();
        this.groupChart?.destroy();
        this.monthlyChart = null;
        this.groupChart = null;

        const o = this.overview;
        if (!o) return;

        Chart.defaults.color = this.cssVar('--text-secondary', '#888');
        const grid = this.gridColor;

        const monthly = o.monthly ?? [];
        const monthlyCanvas = document.getElementById('monthlyCanvas') as HTMLCanvasElement | null;
        if (monthlyCanvas && monthly.length) {
            this.monthlyChart = new Chart(monthlyCanvas, {
                type: 'bar',
                data: {
                    labels: monthly.map((m: any) => this.monthLabel(m.month)),
                    datasets: [
                        {
                            type: 'bar',
                            label: translate.get('stats.dash.monthly.volume'),
                            data: monthly.map((m: any) => m.volume_kg),
                            backgroundColor: 'rgba(237, 115, 52, 0.65)',
                            borderRadius: 4,
                            yAxisID: 'y'
                        },
                        {
                            type: 'line',
                            label: translate.get('stats.dash.monthly.workouts'),
                            data: monthly.map((m: any) => m.workouts),
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
                        y: { beginAtZero: true, grid: { color: grid } },
                        y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { precision: 0 } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        const groups = o.by_muscle_group ?? [];
        const groupCanvas = document.getElementById('groupCanvas') as HTMLCanvasElement | null;
        if (groupCanvas && groups.length) {
            const total = groups.reduce((a: number, g: any) => a + g.volume_kg, 0) || 1;
            this.groupChart = new Chart(groupCanvas, {
                type: 'doughnut',
                data: {
                    labels: groups.map((g: any) => g.name),
                    datasets: [{
                        data: groups.map((g: any) => g.volume_kg),
                        backgroundColor: ['#ed7334', '#3b82f6', '#22c55e', '#a855f7', '#eab308', '#06b6d4', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '62%',
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: (ctx: any) => ` ${ctx.label}: ${this.formatVolume(ctx.parsed)} (${Math.round((ctx.parsed / total) * 100)}%)`
                            }
                        }
                    }
                }
            });
        }
    }

    formatVolume(v: number) {
        return v >= 1000 ? (v / 1000).toFixed(1) + ' t' : v + ' kg';
    }

    formatHistoryDate(date: string) {
        return new Date(date).toLocaleDateString(this.dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
    }
}
export default toNative(StatsPage);
