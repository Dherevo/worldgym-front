import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

@Component({})
class WorkoutDetailPage extends Vue {

    workout: any = null;
    loading = false;

    // Set editing
    editingSet: any = null;
    editReps = 0;
    editWeight = 0;
    editRest = 0;
    editSetNotes = '';
    editFailed = false;
    editDropset = false;
    savingSet = false;

    // New set
    addingSetWeId: number | null = null;
    newReps = 10;
    newWeight = 0;
    newRest = 90;
    newSetNotes = '';
    newFailed = false;
    newDropset = false;

    // Drag & drop reorder
    dragFromIdx: number | null = null;

    // Exercise search
    showExerciseSearch = false;
    exerciseQuery = '';
    allExercises: any[] = [];
    filteredExercises: any[] = [];

    get workoutId() { return this.param('id'); }

    created() {
        this.fetchWorkout();
        this.fetchExercises();
    }

    fetchWorkout() {
        this.loading = true;
        http.get(`/workouts/${this.workoutId}`)
        .then((res: any) => { this.workout = res; })
        .catch(() => {})
        .finally(() => { this.loading = false; });
    }

    fetchExercises() {
        http.get('/exercises?pageSize=2000')
        .then((res: any) => { this.allExercises = res.items ?? []; })
        .catch(() => {});
    }

    filterExercises() {
        const q = this.exerciseQuery.toLowerCase();
        this.filteredExercises = q
            ? this.allExercises.filter(e => e.name.toLowerCase().includes(q)).slice(0, 10)
            : this.allExercises.slice(0, 10);
    }

    addExercise(ex: any) {
        http.post(`/workouts/${this.workoutId}/exercises`)
        .data({ exercise_id: ex.id })
        .then(() => {
            this.showExerciseSearch = false;
            this.exerciseQuery = '';
            this.filteredExercises = [];
            this.fetchWorkout();
        })
        .catch(() => App.notification(translate.get('workoutDetail.errors.addExercise')).setType('error').show());
    }

    deleteExercise(we: any) {
        App.confirm(translate.get('workoutDetail.confirmDeleteExercise', { name: we.exercise?.name }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/workouts/${this.workoutId}/exercises/${we.id}`)
            .then(() => this.fetchWorkout())
            .catch(() => App.notification(translate.get('workoutDetail.errors.delete')).setType('error').show());
        });
    }

    openSetEdit(_we: any, s: any) {
        this.addingSetWeId = null;
        this.editingSet = s;
        this.editReps = s.reps;
        this.editWeight = s.weight;
        this.editRest = s.rest_seconds ?? 90;
        this.editSetNotes = s.notes ?? '';
        this.editFailed = s.is_failed ?? false;
        this.editDropset = s.is_dropset ?? false;
    }

    saveSetEdit(we: any) {
        this.savingSet = true;
        http.put(`/workouts/${this.workoutId}/exercises/${we.id}/sets/${this.editingSet.id}`)
        .data({ reps: this.editReps, weight: this.editWeight, rest_seconds: this.editRest, notes: this.editSetNotes, is_failed: this.editFailed, is_dropset: this.editDropset })
        .then(() => { this.editingSet = null; this.fetchWorkout(); })
        .catch(() => App.notification(translate.get('workoutDetail.errors.save')).setType('error').show())
        .finally(() => { this.savingSet = false; });
    }

    deleteSet(we: any, s: any) {
        App.confirm(translate.get('workoutDetail.confirmDeleteSet', { n: s.set_number }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/workouts/${this.workoutId}/exercises/${we.id}/sets/${s.id}`)
            .then(() => this.fetchWorkout())
            .catch(() => App.notification(translate.get('workoutDetail.errors.delete')).setType('error').show());
        });
    }

    openAddSet(we: any) {
        this.editingSet = null;
        this.addingSetWeId = we.id;
        const lastSet = we.sets?.at(-1);
        this.newReps = lastSet?.reps ?? 10;
        this.newWeight = lastSet?.weight ?? 0;
        this.newRest = lastSet?.rest_seconds ?? 90;
        this.newSetNotes = '';
        this.newFailed = false;
        this.newDropset = false;
    }

    saveNewSet(we: any) {
        this.savingSet = true;
        http.post(`/workouts/${this.workoutId}/exercises/${we.id}/sets`)
        .data({ set_number: (we.sets?.length ?? 0) + 1, reps: this.newReps, weight: this.newWeight, rest_seconds: this.newRest, notes: this.newSetNotes, is_failed: this.newFailed, is_dropset: this.newDropset })
        .then(() => { this.addingSetWeId = null; this.fetchWorkout(); })
        .catch(() => App.notification(translate.get('workoutDetail.errors.save')).setType('error').show())
        .finally(() => { this.savingSet = false; });
    }

    dragStart(idx: number) {
        this.dragFromIdx = idx;
    }

    dropOn(idx: number) {
        if (this.dragFromIdx === null || this.dragFromIdx === idx) return;
        const exercises = this.workout.workout_exercises;
        const moved = exercises.splice(this.dragFromIdx, 1)[0];
        exercises.splice(idx, 0, moved);
        this.dragFromIdx = null;
        const order = exercises.map((we: any, i: number) => ({ id: we.id, order_index: i + 1 }));
        (http as any).patch(`/workouts/${this.workoutId}/exercises/reorder`)
        .data({ order })
        .catch(() => App.notification(translate.get('workoutDetail.errors.reorder')).setType('error').show());
    }

    dragEnd() {
        this.dragFromIdx = null;
    }

    get dateLocale(): string {
        return ({ ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as any)[translate.currentLanguage] ?? 'ca-ES';
    }

    formatDate(date: string) {
        return new Date(date).toLocaleDateString(this.dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    formatDuration(): string | null {
        const w = this.workout;
        if (!w?.started_at || !w?.finished_at) return null;
        const secs = w.active_seconds ?? Math.round((new Date(w.finished_at).getTime() - new Date(w.started_at).getTime()) / 1000);
        if (secs < 60) return null;
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        return h > 0 ? `${h}h ${m}min` : `${m}min`;
    }

    totalVolume(sets: any[]) {
        const kg = sets.reduce((acc: number, s: any) => acc + (s.reps * s.weight), 0);
        return kg >= 1000 ? (kg / 1000).toFixed(1) + ' t' : kg + ' kg';
    }
}
export default toNative(WorkoutDetailPage);
