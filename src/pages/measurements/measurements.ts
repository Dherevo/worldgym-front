import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import { Chart, registerables } from 'chart.js';
import userStore from "@/modules/userStore";

Chart.register(...registerables);

// Local Y-m-d, so the date does not shift with the timezone like toISOString() does
function today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({})
class MeasurementsPage extends Vue {

    items: any[] = [];
    heightCm: number | null = null;
    bmi: number | null = null;
    bmiCategory: string | null = null;
    loading = false;

    weightChart: Chart | null = null;
    waistChart: Chart | null = null;

    showModal = false;
    editingId: number | null = null;
    date = '';
    weight = '';
    waist = '';
    saving = false;

    readonly todayStr = today();

    created() {
        this.fetchMeasurements();
    }

    beforeUnmount() {
        this.weightChart?.destroy();
        this.waistChart?.destroy();
    }

    fetchMeasurements() {
        this.loading = true;
        http.get('/measurements')
        .then((res: any) => this.apply(res))
        .catch(() => App.notification(translate.get('measurements.errors.load')).setType('error').show())
        .finally(() => { this.loading = false; });
    }

    apply(res: any) {
        this.items = res.items ?? [];
        this.heightCm = res.height_cm;
        this.bmi = res.bmi;
        this.bmiCategory = res.bmi_category;

        // The profile weight follows the latest measurement
        if (userStore.data && this.items.length) {
            userStore.data.weight_kg = this.items[this.items.length - 1].weight_kg;
        }

        // Canvases only exist once the v-if blocks render
        this.$nextTick(() => this.renderCharts());
    }

    get dateLocale(): string {
        return ({ ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as any)[translate.currentLanguage] ?? 'ca-ES';
    }

    formatDate(date: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
        const [y, m, d] = date.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(this.dateLocale, opts);
    }

    get latest(): any | null {
        return this.items.length ? this.items[this.items.length - 1] : null;
    }

    get totalChange(): string {
        if (this.items.length < 2) return '—';
        const diff = this.latest.weight_kg - this.items[0].weight_kg;
        return `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
    }

    get tableRows(): any[] {
        return [...this.items].reverse();
    }

    get waistItems(): any[] {
        return this.items.filter(i => i.waist_cm !== null);
    }

    renderCharts() {
        this.weightChart?.destroy();
        this.weightChart = null;
        this.waistChart?.destroy();
        this.waistChart = null;

        const grid = { color: 'rgba(128, 128, 128, 0.2)' };

        const weightCanvas = document.getElementById('measurementsWeightCanvas') as HTMLCanvasElement | null;
        if (weightCanvas && this.items.length) {
            const hasBmi = this.items.some(i => i.bmi !== null);
            const datasets: any[] = [{
                label: translate.get('measurements.charts.weightLabel'),
                data: this.items.map(i => i.weight_kg),
                borderColor: 'rgb(237, 115, 52)',
                backgroundColor: 'rgba(237, 115, 52, 0.1)',
                borderWidth: 2,
                pointRadius: 4,
                tension: 0.3,
                fill: true,
                yAxisID: 'y',
            }];
            if (hasBmi) {
                datasets.push({
                    label: translate.get('measurements.charts.bmiLabel'),
                    data: this.items.map(i => i.bmi),
                    borderColor: 'rgb(102, 128, 255)',
                    borderWidth: 2,
                    borderDash: [6, 4],
                    pointRadius: 3,
                    tension: 0.3,
                    yAxisID: 'y1',
                });
            }

            this.weightChart = new Chart(weightCanvas, {
                type: 'line',
                data: { labels: this.items.map(i => this.formatDate(i.date, { day: 'numeric', month: 'short' })), datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { display: hasBmi } },
                    scales: {
                        y: { beginAtZero: false, grid, position: 'left' },
                        y1: { display: hasBmi, beginAtZero: false, grid: { drawOnChartArea: false }, position: 'right' },
                        x: { grid: { display: false } },
                    },
                },
            });
        }

        const waistCanvas = document.getElementById('measurementsWaistCanvas') as HTMLCanvasElement | null;
        if (waistCanvas && this.waistItems.length) {
            this.waistChart = new Chart(waistCanvas, {
                type: 'line',
                data: {
                    labels: this.waistItems.map(i => this.formatDate(i.date, { day: 'numeric', month: 'short' })),
                    datasets: [{
                        label: translate.get('measurements.charts.waistLabel'),
                        data: this.waistItems.map(i => i.waist_cm),
                        borderColor: 'rgb(74, 222, 128)',
                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        fill: true,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: false, grid }, x: { grid: { display: false } } },
                },
            });
        }
    }

    openCreate() {
        this.editingId = null;
        this.date = this.todayStr;
        // Start from the last known weight, which is usually close to the new one
        this.weight = this.latest ? String(this.latest.weight_kg) : '';
        this.waist = '';
        this.showModal = true;
    }

    openEdit(m: any) {
        this.editingId = m.id;
        this.date = m.date;
        this.weight = String(m.weight_kg);
        this.waist = m.waist_cm !== null ? String(m.waist_cm) : '';
        this.showModal = true;
    }

    get valid(): boolean {
        const w = Number(this.weight);
        return !!this.date && w >= 30 && w <= 300;
    }

    save() {
        if (this.saving || !this.valid) return;
        this.saving = true;

        const body = { date: this.date, weight_kg: Number(this.weight), waist_cm: this.waist === '' ? null : Number(this.waist) };
        const request = this.editingId ? http.put(`/measurements/${this.editingId}`) : http.post('/measurements');

        request.data(body)
        .then((res: any) => {
            this.apply(res);
            this.showModal = false;
        })
        .catch((e: any) => {
            const code: string = e?.data?.error ?? '';
            const key = ({ 'weight.invalid': 'weight', 'waist.invalid': 'waist', 'date.invalid': 'date', 'measurement.duplicate': 'duplicate' } as any)[code] ?? 'save';
            App.notification(translate.get(`measurements.errors.${key}`)).setType('error').show();
        })
        .finally(() => { this.saving = false; });
    }

    remove(m: any) {
        App.confirm(translate.get('measurements.confirmDelete', { date: this.formatDate(m.date) }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/measurements/${m.id}`)
            .then((res: any) => this.apply(res))
            .catch(() => App.notification(translate.get('measurements.errors.delete')).setType('error').show());
        });
    }
}
export default toNative(MeasurementsPage);
