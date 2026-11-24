import { Component, Vue, Watch, toNative } from "vue-facing-decorator";
import { http, translate } from "lib";
import { Chart, registerables } from 'chart.js';

import BackButton from "@/components/back-button/back-button.vue";
import ExerciseAnimation from "@/components/exercise-animation/exercise-animation.vue";

Chart.register(...registerables);

// Chart.js instances must not be reactive (Vue would wrap them in proxies)
let chart: Chart | null = null;

type Tab = 'summary' | 'history' | 'directions';
type Metric = 'weight' | 'oneRm' | 'volume' | 'reps';
type Range = 'month' | 'threeMonths' | 'year' | 'all';

const DAY = 86400000;
const RANGE_DAYS: Record<Range, number> = { month: 31, threeMonths: 92, year: 366, all: 0 };

// Estimated one-rep max (Epley)
const oneRm = (weight: number, reps: number) => (reps <= 1 ? weight : weight * (1 + reps / 30));
// Epley is only reliable up to about 10 reps: higher-rep sets inflate it (300 kg x 15 would give 450 kg).
// So only sets of up to 10 reps count; a session with none has no estimate (0)
const ONE_RM_MAX_REPS = 10;
const oneRmSets = (sets: any[]) => sets.filter(s => s.reps <= ONE_RM_MAX_REPS && s.weight > 0);
const round = (n: number) => Math.round(n * 100) / 100;

@Component({ components: { BackButton, ExerciseAnimation } })
class ExerciseDetailPage extends Vue {

    exercise: any = null;
    sessions: any[] = [];      // newest first, each with its sets
    loading = true;
    failed = false;

    tab: Tab = 'summary';
    metric: Metric = 'weight';
    range: Range = 'threeMonths';
    // Sessions shown in the history: the long list is added 20 at a time (a very tall block would never get revealed by the page animation)
    visibleCount = 20;

    readonly tabs: Tab[] = ['summary', 'history', 'directions'];
    readonly ranges: Range[] = ['month', 'threeMonths', 'year', 'all'];

    get exerciseId() { return this.param('id'); }

    get dateLocale() {
        const l = translate.currentLanguage;
        return l === 'es' ? 'es-ES' : l === 'en' ? 'en-GB' : 'ca-ES';
    }

    created() {
        // The tab lives in the URL (?tab=history), so "back" from a workout returns to the same tab
        const q = String((this as any).$route.query.tab ?? '');
        if (this.tabs.includes(q as Tab)) this.tab = q as Tab;

        Promise.all([
            http.get(`/exercises/${this.exerciseId}`),
            http.get(`/stats/exercises/${this.exerciseId}/history`).catch(() => ({ sessions: [] })),
        ])
        .then(([exercise, history]: any[]) => {
            this.exercise = exercise;
            this.sessions = history?.sessions ?? [];
            if (this.bodyweightOnly) this.metric = 'reps';
        })
        .catch(() => { this.failed = true; })
        .finally(() => {
            this.loading = false;
            this.$nextTick(() => this.renderChart());
        });
    }

    beforeUnmount() {
        chart?.destroy();
        chart = null;
    }

    get visibleSessions(): any[] {
        return this.sessions.slice(0, this.visibleCount);
    }

    // ---- Exercise info ----

    get muscles(): { primary: string; secondary: string } {
        const all: any[] = this.exercise?.muscles ?? [];
        const names = (list: any[]) => list.map(m => m.name).filter(Boolean).join(', ');
        const primary = all.filter(m => m.pivot?.is_primary);
        return {
            primary: names(primary.length ? primary : all.slice(0, 1)),
            secondary: names(primary.length ? all.filter(m => !m.pivot?.is_primary) : all.slice(1)),
        };
    }

    // The description is written as plain text: one step per line, or per sentence if it has no line breaks
    get directions(): string[] {
        const text = String(this.exercise?.description ?? '').trim();
        if (!text) return [];
        const lines = text.split(/\r?\n+/).map(l => l.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean);
        if (lines.length > 1) return lines;
        return text.split(/(?<=[.!?])\s+/).map(l => l.trim()).filter(Boolean);
    }

    // No set with weight: the exercise is done with the body weight, so reps are what progresses
    get bodyweightOnly(): boolean {
        return this.sessions.length > 0 && !this.sessions.some(s => s.sets.some((x: any) => x.weight > 0));
    }

    get metrics(): Metric[] {
        return this.bodyweightOnly ? ['reps', 'volume'] : ['weight', 'oneRm', 'volume'];
    }

    // ---- Per session figures (oldest first, for the chart) ----

    sessionValue(session: any, metric: Metric): number {
        const sets: any[] = session.sets;
        if (metric === 'weight') return Math.max(0, ...sets.map(s => s.weight));
        if (metric === 'oneRm') return round(Math.max(0, ...oneRmSets(sets).map(s => oneRm(s.weight, s.reps))));
        if (metric === 'reps') return Math.max(0, ...sets.map(s => s.reps));
        // volume: kg moved, or total reps with the body weight
        return round(sets.reduce((sum, s) => sum + (this.bodyweightOnly ? s.reps : s.weight * s.reps), 0));
    }

    get rangeSessions(): any[] {
        const days = RANGE_DAYS[this.range];
        const from = days ? Date.now() - days * DAY : 0;
        return [...this.sessions].reverse().filter(s => new Date(s.date).getTime() >= from);
    }

    get unit(): string {
        if (this.metric === 'reps') return translate.get('exerciseDetail.repsUnit');
        return this.bodyweightOnly ? translate.get('exerciseDetail.repsUnit') : 'kg';
    }

    // Figure written above the chart: the best of the period for the chosen metric
    get headline(): string {
        const values = this.rangeSessions.map(s => this.sessionValue(s, this.metric));
        if (!values.length) return '—';
        return `${Math.max(...values)} ${this.unit}`;
    }

    // ---- Records ----

    get records() {
        const sets = this.sessions.flatMap(s => s.sets.map((x: any) => ({ ...x, date: s.date })));
        if (!sets.length) return null;

        const best = (key: (s: any) => number) => sets.reduce((a, b) => (key(b) > key(a) ? b : a));
        const bySession = (m: Metric) => this.sessions.reduce((a, s) => Math.max(a, this.sessionValue(s, m)), 0);

        if (this.bodyweightOnly) {
            return {
                bodyweight: true,
                maxReps: best(s => s.reps).reps,
                sessionReps: bySession('volume'),
            };
        }

        const weight = best(s => s.weight * 1000 + s.reps);
        const volume = best(s => s.weight * s.reps);
        return {
            bodyweight: false,
            maxWeight: weight.weight,
            bestOneRm: bySession('oneRm'),
            bestSet: `${volume.weight} kg × ${volume.reps}`,
            sessionVolume: bySession('volume'),
        };
    }

    // Heaviest weight lifted for each number of reps, e.g. 10 → 180 kg
    get repRecords(): { reps: number; weight: number }[] {
        const best = new Map<number, number>();
        for (const s of this.sessions) {
            for (const x of s.sets) {
                if (x.weight > 0 && x.weight > (best.get(x.reps) ?? 0)) best.set(x.reps, x.weight);
            }
        }
        return [...best.entries()].map(([reps, weight]) => ({ reps, weight })).sort((a, b) => a.reps - b.reps);
    }

    // ---- Chart ----

    setTab(tab: Tab) {
        this.tab = tab;
        this.$router.replace({ query: tab === 'summary' ? {} : { tab } });
        if (tab === 'summary') this.$nextTick(() => this.renderChart());
    }

    setMetric(m: Metric) { this.metric = m; }
    setRange(r: Range) { this.range = r; }

    @Watch('metric')
    onMetric() { this.renderChart(); }

    @Watch('range')
    onRange() { this.renderChart(); }

    cssVar(name: string, fallback: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    }

    renderChart() {
        chart?.destroy();
        chart = null;

        const canvas = this.$refs.canvas as HTMLCanvasElement | undefined;
        const list = this.rangeSessions;
        if (!canvas || !list.length) return;

        const primary = this.cssVar('--primary-color', '#ED7334');
        Chart.defaults.color = this.cssVar('--text-secondary', '#888');
        const grid = this.cssVar('--border-color', 'rgba(128, 128, 128, 0.25)');
        const unit = this.unit;

        chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: list.map(s => this.shortDate(s.date)),
                datasets: [{
                    data: list.map(s => { const v = this.sessionValue(s, this.metric); return this.metric === 'oneRm' && !v ? null : v; }),
                    spanGaps: true,
                    borderColor: primary,
                    backgroundColor: primary,
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.25,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'nearest', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (c: any) => `${c.parsed.y} ${unit}` } },
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: grid }, ticks: { callback: (v: any) => `${v}` } },
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 5, maxRotation: 0 } },
                }
            }
        });
    }

    // ---- Formatting ----

    shortDate(date: string): string {
        return new Date(date).toLocaleDateString(this.dateLocale, { day: 'numeric', month: 'short' });
    }

    longDate(date: string): string {
        return new Date(date).toLocaleDateString(this.dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
    }

    setLabel(s: any): string {
        return s.weight > 0 ? `${s.weight} kg × ${s.reps}` : `${s.reps} ${translate.get('exerciseDetail.repsUnit')}`;
    }

    goBack() {
        if (window.history.state?.back) this.back();
        else this.to('/exercises');
    }
}
export default toNative(ExerciseDetailPage);
