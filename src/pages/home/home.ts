import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

@Component({})
class HomePage extends Vue {

    activeWorkout: any = null;

    defaultRoutine: any = null;
    nextDay: any = null;
    loadingRoutine = false;
    starting = false;

    // Selector d'altra rutina
    otherRoutines: any[] = [];
    showRoutinePicker = false;
    pickerRoutine: any = null;
    pickerNextDay: any = null;
    loadingPickerDay = false;
    startingPicker = false;

    recentWorkouts: any[] = [];
    loadingWorkouts = false;

    created() {
        this.fetchActiveWorkout();
        this.fetchDefaultRoutine();
        this.fetchRecentWorkouts();
    }

    fetchActiveWorkout() {
        http.get('/workouts/active')
        .then((res: any) => { this.activeWorkout = res?.id ? res : null; })
        .catch(() => { this.activeWorkout = null; });
    }

    fetchDefaultRoutine() {
        this.loadingRoutine = true;
        http.get('/routines')
        .then((res: any) => {
            const routines = res.items ?? [];
            const def = routines.find((r: any) => r.is_default);
            this.otherRoutines = routines.filter((r: any) => !r.is_default);

            if (!def) { this.loadingRoutine = false; return; }

            http.get(`/routines/${def.id}`)
            .then((r: any) => {
                this.defaultRoutine = r;
                this.determineNextDay();
            })
            .finally(() => { this.loadingRoutine = false; });
        })
        .catch(() => { this.loadingRoutine = false; });
    }

    determineNextDay() {
        const days = this.defaultRoutine?.days ?? [];
        if (!days.length) return;

        http.get(`/routines/${this.defaultRoutine.id}/next-day`)
        .then((res: any) => { this.nextDay = res.day; })
        .catch(() => { this.nextDay = days[0]; });
    }

    startNextDay() {
        if (!this.nextDay || this.starting) return;
        const today = new Date().toISOString().split('T')[0];
        this.starting = true;
        http.post(`/routines/${this.defaultRoutine.id}/days/${this.nextDay.id}/start`)
        .data({ date: today, notes: this.nextDay.name })
        .then((res: any) => { this.to(`/workout/${res.id}`); })
        .catch(() => App.notification(translate.get('home.errors.start')).setType('error').show())
        .finally(() => { this.starting = false; });
    }

    // Selector d'altra rutina
    openRoutinePicker() {
        this.pickerRoutine = null;
        this.pickerNextDay = null;
        this.showRoutinePicker = true;
    }

    selectPickerRoutine(r: any) {
        this.pickerRoutine = r;
        this.pickerNextDay = null;
        this.loadingPickerDay = true;
        http.get(`/routines/${r.id}/next-day`)
        .then((res: any) => { this.pickerNextDay = res.day; })
        .catch(() => {})
        .finally(() => { this.loadingPickerDay = false; });
    }

    startPickerRoutine() {
        if (!this.pickerNextDay || this.startingPicker) return;
        const today = new Date().toISOString().split('T')[0];
        this.startingPicker = true;
        http.post(`/routines/${this.pickerRoutine.id}/days/${this.pickerNextDay.id}/start`)
        .data({ date: today, notes: this.pickerNextDay.name })
        .then((res: any) => { this.to(`/workout/${res.id}`); })
        .catch(() => App.notification(translate.get('home.errors.start')).setType('error').show())
        .finally(() => { this.startingPicker = false; });
    }

    startEmptyWorkout() {
        const today = new Date().toISOString().split('T')[0];
        http.post('/workouts').data({ date: today, notes: null })
        .then((res: any) => { this.to(`/workout/${res.id}`); })
        .catch(() => App.notification(translate.get('home.errors.create')).setType('error').show());
    }

    fetchRecentWorkouts() {
        this.loadingWorkouts = true;
        http.get('/workouts')
        .then((res: any) => { this.recentWorkouts = (res.items ?? []).slice(0, 5); })
        .catch(() => {})
        .finally(() => { this.loadingWorkouts = false; });
    }

    formatDate(date: string) {
        const l = translate.currentLanguage;
        const locale = l === 'es' ? 'es-ES' : l === 'en' ? 'en-GB' : 'ca-ES';
        return new Date(date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    }
}
export default toNative(HomePage);
