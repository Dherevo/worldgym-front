import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

@Component({})
class RoutineDetailPage extends Vue {

    routine: any = null;

    // Global routines (templates) are managed from the backoffice
    get canEdit(): boolean {
        return !!this.routine && !this.routine.is_global;
    }

    loading = false;
    starting = false;

    showDayForm = false;
    editingDay: any = null;
    dayForm = { day_number: 1, name: '' };
    savingDay = false;

    showExerciseForm = false;
    activeDay: any = null;
    editingExercise: any = null;
    exerciseForm: any = {
        exercise_id: null,
        order_index: 1,
        sets_target: 3,
        reps_target: 10,
        weight_target: 0,
        rest_seconds: 90
    };
    allExercises: any[] = [];
    muscleGroups: any[] = [];
    exerciseQuery = '';
    savingExercise = false;

    // Drag & drop reorder: days or the exercises of one day
    dragKind: 'day' | 'exercise' | null = null;
    dragFromIdx: number | null = null;
    dragDayId: number | null = null;

    get routineId() {
        return this.param('id');
    }

    created() {
        this.fetchRoutine();
        this.fetchExercises();
    }

    fetchRoutine() {
        this.loading = true;
        http.get(`/routines/${this.routineId}`)
        .then((res: any) => { this.routine = res; })
        .catch(() => {})
        .finally(() => { this.loading = false; });
    }

    // Muscle groups worked on a day, from the primary muscle of each of its exercises (most exercises first)
    dayGroups(day: any): any[] {
        const counts: Record<number, number> = {};
        for (const ex of day.exercises ?? []) {
            for (const m of ex.exercise?.muscles ?? []) {
                if (m.pivot?.is_primary) counts[m.muscle_group_id] = (counts[m.muscle_group_id] ?? 0) + 1;
            }
        }
        return Object.keys(counts)
            .map(id => ({ id: Number(id), n: counts[Number(id)], name: this.muscleGroups.find((g: any) => g.id === Number(id))?.name }))
            .filter(g => g.name)
            .sort((a, b) => b.n - a.n);
    }

    fetchMuscleGroups() {
        http.get('/muscle-groups?pageSize=500')
        .then((res: any) => { this.muscleGroups = res.items ?? []; })
        .catch(() => {});
    }

    fetchExercises() {
        this.fetchMuscleGroups();
        http.get('/exercises?pageSize=2000')
        .then((res: any) => { this.allExercises = res.items ?? []; })
        .catch(() => {});
    }

    startDay(day: any) {
        const today = new Date().toISOString().split('T')[0];
        this.starting = true;
        http.post(`/routines/${this.routineId}/days/${day.id}/start`)
        .data({ date: today, notes: day.name })
        .then((res: any) => {
            this.to(`/workout/${res.id}`);
        })
        .catch(() => App.notification(translate.get('routineDetail.errors.start')).setType('error').show())
        .finally(() => { this.starting = false; });
    }

    dragStart(kind: 'day' | 'exercise', idx: number, dayId: number | null = null) {
        this.dragKind = kind;
        this.dragFromIdx = idx;
        this.dragDayId = dayId;
    }

    dragEnd() {
        this.dragKind = null;
        this.dragFromIdx = null;
        this.dragDayId = null;
    }

    dropDay(idx: number) {
        if (this.dragKind !== 'day' || this.dragFromIdx === null || this.dragFromIdx === idx) return this.dragEnd();

        const days = this.routine.days;
        days.splice(idx, 0, days.splice(this.dragFromIdx, 1)[0]);
        days.forEach((d: any, i: number) => { d.day_number = i + 1; });
        this.dragEnd();

        http.patch(`/routines/${this.routineId}/days/reorder`)
        .data({ order: days.map((d: any) => d.id) })
        .catch(() => {
            App.notification(translate.get('routineDetail.errors.reorder')).setType('error').show();
            this.fetchRoutine();
        });
    }

    dropExercise(day: any, idx: number) {
        // Exercises only move inside their own day
        if (this.dragKind !== 'exercise' || this.dragDayId !== day.id || this.dragFromIdx === null || this.dragFromIdx === idx) return this.dragEnd();

        const exercises = day.exercises;
        exercises.splice(idx, 0, exercises.splice(this.dragFromIdx, 1)[0]);
        exercises.forEach((e: any, i: number) => { e.order_index = i + 1; });
        this.dragEnd();

        http.patch(`/routines/${this.routineId}/days/${day.id}/exercises/reorder`)
        .data({ order: exercises.map((e: any) => e.id) })
        .catch(() => {
            App.notification(translate.get('routineDetail.errors.reorder')).setType('error').show();
            this.fetchRoutine();
        });
    }

    openAddDay() {
        this.editingDay = null;
        const nextNum = (this.routine?.days?.length || 0) + 1;
        this.dayForm = { day_number: nextNum, name: '' };
        this.showDayForm = true;
    }

    openEditDay(day: any) {
        this.editingDay = day;
        this.dayForm = { day_number: day.day_number, name: day.name };
        this.showDayForm = true;
    }

    saveDay() {
        if (!this.dayForm.name.trim()) return;
        this.savingDay = true;
        const req = this.editingDay
            ? http.put(`/routines/${this.routineId}/days/${this.editingDay.id}`).data(this.dayForm)
            : http.post(`/routines/${this.routineId}/days`).data(this.dayForm);

        req.then(() => {
            this.showDayForm = false;
            this.fetchRoutine();
        })
        .catch(() => App.notification(translate.get('routineDetail.errors.saveDay')).setType('error').show())
        .finally(() => { this.savingDay = false; });
    }

    deleteDay(day: any) {
        App.confirm(translate.get('routineDetail.confirmDelete', { name: day.name }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/routines/${this.routineId}/days/${day.id}`)
            .then(() => this.fetchRoutine())
            .catch(() => App.notification(translate.get('routineDetail.errors.deleteDay')).setType('error').show());
        });
    }

    // Group of an exercise = group of its first primary muscle (any muscle as a fallback)
    groupNameOf(ex: any): string {
        const muscles = ex.muscles ?? [];
        const m = muscles.find((x: any) => x.pivot?.is_primary) ?? muscles[0];
        const groupId = m?.muscle_group_id ?? m?.muscle_group?.id;
        return this.muscleGroups.find((g: any) => g.id === groupId)?.name
            ?? m?.muscle_group?.name
            ?? translate.get('routineDetail.exerciseForm.noGroup');
    }

    // Search results as "optgroups": [{ name, items }], groups sorted by name, "no group" last
    get groupedExercises() {
        const q = this.exerciseQuery.trim().toLowerCase();
        const list = (q ? this.allExercises.filter((e: any) => e.name.toLowerCase().includes(q)) : this.allExercises)
            .slice(0, 60);
        const noGroup = translate.get('routineDetail.exerciseForm.noGroup');
        const groups: Record<string, any[]> = {};
        for (const ex of list) {
            const name = this.groupNameOf(ex);
            groups[name] ??= [];
            groups[name].push(ex);
        }
        return Object.keys(groups)
            .sort((a, b) => (a === noGroup ? 1 : b === noGroup ? -1 : a.localeCompare(b)))
            .map(name => ({ name, items: groups[name] }));
    }

    get selectedExerciseName(): string {
        const id = this.exerciseForm.exercise_id;
        return this.allExercises.find((e: any) => e.id === id)?.name ?? this.editingExercise?.exercise?.name ?? '';
    }

    selectExercise(ex: any) {
        this.exerciseForm.exercise_id = ex.id;
        this.exerciseQuery = '';
    }

    clearSelectedExercise() {
        this.exerciseForm.exercise_id = null;
        this.exerciseQuery = '';
    }

    openAddExercise(day: any) {
        this.activeDay = day;
        this.exerciseQuery = '';
        this.editingExercise = null;
        const nextOrder = (day.exercises?.length || 0) + 1;
        this.exerciseForm = { exercise_id: null, order_index: nextOrder, sets_target: 3, reps_target: 10, weight_target: 0, rest_seconds: 90 };
        this.showExerciseForm = true;
    }

    openEditExercise(day: any, ex: any) {
        this.activeDay = day;
        this.exerciseQuery = '';
        this.editingExercise = ex;
        this.exerciseForm = {
            exercise_id: ex.exercise?.id,
            order_index: ex.order_index,
            sets_target: ex.sets_target,
            reps_target: ex.reps_target,
            weight_target: ex.weight_target,
            rest_seconds: ex.rest_seconds
        };
        this.showExerciseForm = true;
    }

    saveExercise() {
        if (!this.exerciseForm.exercise_id) return;
        this.savingExercise = true;
        const req = this.editingExercise
            ? http.put(`/routines/${this.routineId}/days/${this.activeDay.id}/exercises/${this.editingExercise.id}`).data(this.exerciseForm)
            : http.post(`/routines/${this.routineId}/days/${this.activeDay.id}/exercises`).data(this.exerciseForm);

        req.then(() => {
            this.showExerciseForm = false;
            this.fetchRoutine();
        })
        .catch(() => App.notification(translate.get('routineDetail.errors.saveExercise')).setType('error').show())
        .finally(() => { this.savingExercise = false; });
    }

    deleteExercise(day: any, ex: any) {
        App.confirm(translate.get('routineDetail.confirmDelete', { name: ex.exercise?.name }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/routines/${this.routineId}/days/${day.id}/exercises/${ex.id}`)
            .then(() => this.fetchRoutine())
            .catch(() => App.notification(translate.get('routineDetail.errors.delete')).setType('error').show());
        });
    }
}
export default toNative(RoutineDetailPage);
