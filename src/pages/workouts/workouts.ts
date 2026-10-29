import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

@Component({})
class WorkoutsPage extends Vue {

    workouts: any[] = [];
    loading = false;
    dateFrom = '';
    dateTo = '';

    showModal = false;
    editingWorkout: any = null;
    editDate = '';
    editNotes = '';
    saving = false;

    created() {
        this.fetchWorkouts();
    }

    fetchWorkouts() {
        this.loading = true;
        const params: any = {};
        if (this.dateFrom) params.date_from = this.dateFrom;
        if (this.dateTo) params.date_to = this.dateTo;

        http.get('/workouts').data(params)
        .then((res: any) => { this.workouts = res.items ?? []; })
        .catch(() => {})
        .finally(() => { this.loading = false; });
    }

    openCreate() {
        this.editingWorkout = null;
        this.editDate = new Date().toISOString().slice(0, 10);
        this.editNotes = '';
        this.showModal = true;
    }

    openEdit(w: any) {
        this.editingWorkout = w;
        this.editDate = w.date;
        this.editNotes = w.notes ?? '';
        this.showModal = true;
    }

    saveCreate() {
        this.saving = true;
        http.post('/workouts')
        .data({ date: this.editDate, notes: this.editNotes })
        .then(() => {
            this.showModal = false;
            this.fetchWorkouts();
        })
        .catch(() => App.notification(translate.get('workouts.errors.create')).setType('error').show())
        .finally(() => { this.saving = false; });
    }

    saveEdit() {
        this.saving = true;
        http.put(`/workouts/${this.editingWorkout.id}`)
        .data({ date: this.editDate, notes: this.editNotes })
        .then(() => {
            this.showModal = false;
            this.editingWorkout = null;
            this.fetchWorkouts();
        })
        .catch(() => App.notification(translate.get('workouts.errors.save')).setType('error').show())
        .finally(() => { this.saving = false; });
    }

    deleteWorkout(w: any) {
        App.confirm(translate.get('workouts.confirmDelete', { date: this.formatDate(w.date) }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/workouts/${w.id}`)
            .then(() => this.fetchWorkouts())
            .catch(() => App.notification(translate.get('workouts.errors.delete')).setType('error').show());
        });
    }

    get dateLocale(): string {
        return ({ ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as any)[translate.currentLanguage] ?? 'ca-ES';
    }

    formatDate(date: string) {
        return new Date(date).toLocaleDateString(this.dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    formatDuration(w: any): string | null {
        if (!w.started_at || !w.finished_at) return null;
        const secs = w.active_seconds ?? Math.round((new Date(w.finished_at).getTime() - new Date(w.started_at).getTime()) / 1000);
        if (secs < 60) return null;
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        return h > 0 ? `${h}h ${m}min` : `${m}min`;
    }
}
export default toNative(WorkoutsPage);
