import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, translate } from "lib";
import { Chart, registerables } from 'chart.js';
import BackButton from "@/components/back-button/back-button.vue";
import { bucketize, alignedStart } from "@/modules/chartBuckets";

Chart.register(...registerables);

type ExMetric = 'weight' | 'volume' | 'reps';

// Chart.js instances must not be reactive (Vue would wrap them in proxies)
const charts: Record<string, Chart | null> = { group: null };

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

    // Progression: muscle group -> exercise -> previous / current / record
    muscleGroups: any[] = [];

    selectedMuscleGroupId: number | string = '';

    groupStats: any = null;

    loadingGroup = false;

    groupInitDone = false;

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
        if (!from) return {};
        // Starts at the beginning of the first week (month) of the chart, so its first bar is not cut
        return { from: this.isoDate(alignedStart(new Date(from + 'T00:00:00'), new Date())) };
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
        const saved = this.savedState();
        const savedOk = saved?.group && this.muscleGroups.some((g: any) => String(g.id) === String(saved.group));
        const id = savedOk ? saved.group : (this.overview.last_workout?.muscle_group_id ?? this.muscleGroups[0]?.id);
        if (!id) return;
        this.selectedMuscleGroupId = id;
        this.onGroupChange();
    }

    // Opens the exercise page with the same period (and the custom dates, if they are the ones in use)
    openExercise(ex: any) {
        const ranges: Record<string, string> = { month: 'month', '3m': 'threeMonths', year: 'year', all: 'all', custom: 'custom' };
        const query: Record<string, string> = { range: ranges[this.period] ?? 'threeMonths' };
        if (this.period === 'custom') {
            if (this.customFrom) query.from = this.customFrom;
            if (this.customTo) query.to = this.customTo;
        }
        this.$router.push({ path: '/exercise/' + ex.id, query });
    }

    savedState(): any {
        try { return JSON.parse(sessionStorage.getItem('wg_progression') || 'null'); } catch { return null; }
    }

    onGroupChange() {
        try {
            sessionStorage.setItem('wg_progression', JSON.stringify({ group: this.selectedMuscleGroupId, period: this.period, customFrom: this.customFrom, customTo: this.customTo }));
        } catch { /* storage unavailable */ }
        this.groupStats = null;
        if (!this.selectedMuscleGroupId) return;

        this.loadingGroup = true;
        charts.group?.destroy();
        charts.group = null;
        http.get(`/stats/muscle-groups/${this.selectedMuscleGroupId}`).data(this.periodParams())
        .then((res: any) => {
            this.groupStats = res;
            setTimeout(() => { this.renderGroupChart(); }, 0);
        })
        .catch(() => {})
        .finally(() => { this.loadingGroup = false; });
    }

    get selectedGroupName(): string {
        return this.muscleGroups.find((g: any) => g.id === Number(this.selectedMuscleGroupId))?.name ?? '';
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
        // Coming back from an exercise: the group and the period the user had chosen
        const saved = this.savedState();
        if (saved) {
            this.period = saved.period ?? this.period;
            this.customFrom = saved.customFrom ?? '';
            this.customTo = saved.customTo ?? '';
        }
        this.fetchOverview();
        this.fetchMuscleGroups();
    }

    beforeUnmount() {
        charts.group?.destroy();
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
