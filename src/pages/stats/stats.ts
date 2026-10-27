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
    }

    fetchOverview() {
        this.loadingOverview = true;
        const params: any = {};
        if (this.overviewFrom) params.from = this.overviewFrom;
        if (this.overviewTo) params.to = this.overviewTo;
        http.get('/stats/overview').data(params)
        .then((res: any) => { this.overview = res; })
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
                        y: { beginAtZero: false, grid: { color: '#f0f0f0' } },
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
                        y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
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
                        y: { beginAtZero: false, grid: { color: '#f0f0f0' } },
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
                        y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                        x: { grid: { display: false } }
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
