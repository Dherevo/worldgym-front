import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import userStore from "@/modules/userStore";

@Component({})
class RoutineDetailPage extends Vue {

    routine: any = null;

    // Global routines are read-only for regular users
    get canEdit(): boolean {
        return !!this.routine && (!this.routine.is_global || !!userStore.data?.isAdmin);
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
    savingExercise = false;

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

    fetchExercises() {
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

    openAddDay() {
        this.editingDay = null;
        const nextNum = (this.routine?.days?.length || 0) + 1;
        this.dayForm = { day_number: nextNum, name: translate.get('routineDetail.defaultDayName', { n: nextNum }) };
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

    openAddExercise(day: any) {
        this.activeDay = day;
        this.editingExercise = null;
        const nextOrder = (day.exercises?.length || 0) + 1;
        this.exerciseForm = { exercise_id: null, order_index: nextOrder, sets_target: 3, reps_target: 10, weight_target: 0, rest_seconds: 90 };
        this.showExerciseForm = true;
    }

    openEditExercise(day: any, ex: any) {
        this.activeDay = day;
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
