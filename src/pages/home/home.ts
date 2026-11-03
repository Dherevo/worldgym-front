import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import DailyHabits from "@/components/daily-habits/daily-habits.vue";
import CheckIn from "@/components/check-in/check-in.vue";
import localDate from "@/modules/localDate";
import EnergyBar from "@/components/energy-bar/energy-bar.vue";
import { loadEnergyDay } from "@/modules/energyDay";
import type { EnergyDay } from "@/modules/energyDay";

@Component({ components: { DailyHabits, CheckIn, EnergyBar } })
class HomePage extends Vue {

    activeWorkout: any = null;

    defaultRoutine: any = null;
    nextDay: any = null;
    doneDayIds: number[] = [];
    showDayPicker = false;
    loadingRoutine = false;
    starting = false;

    // Selector d'altra rutina
    otherRoutines: any[] = [];
    showRoutinePicker = false;
    pickerRoutine: any = null;
    pickerNextDay: any = null;
    loadingPickerDay = false;
    startingPicker = false;

    // Training days done this week and whether today is a rest day
    week: any = null;
    forceTrain = false;

    // Calories eaten against the ones burned today
    energy: EnergyDay | null = null;

    recentWorkouts: any[] = [];
    loadingWorkouts = false;

    created() {
        this.fetchActiveWorkout();
        this.fetchWeek();
        this.fetchDefaultRoutine();
        this.fetchRecentWorkouts();
        loadEnergyDay().then(d => { this.energy = d; }).catch(() => {});
    }

    fetchWeek() {
        http.get('/week-status').data({ date: localDate() })
        .then((res: any) => { this.week = res; })
        .catch(() => { this.week = null; });
    }

    get restMode(): boolean {
        return !!this.week?.rest_day && !this.forceTrain && !this.activeWorkout;
    }

    // Fewer days left in the week than workouts missing: it cannot be completed
    get weekBehind(): boolean {
        const w = this.week;
        if (!w || !w.routine_days_total || w.week_complete) return false;
        const missing = w.routine_days_total - w.days_done;
        return missing > w.days_left + (w.trained_today ? 0 : 1);
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
        .then((res: any) => { this.nextDay = res.day; this.doneDayIds = res.done_day_ids ?? []; })
        .catch(() => { this.nextDay = days[0]; });
    }

    startNextDay() {
        this.startDay(this.nextDay);
    }

    // Starts any day of the default routine (the suggested one or one picked by the user)
    startDay(day: any) {
        if (!day || this.starting) return;
        const today = new Date().toISOString().split('T')[0];
        this.starting = true;
        http.post(`/routines/${this.defaultRoutine.id}/days/${day.id}/start`)
        .data({ date: today, notes: day.name })
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
        .then((res: any) => { 
            // Only the last two days with workouts; the rest is in the history page
            const days = new Set<string>();
            this.recentWorkouts = (res.items ?? []).filter((w: any) => {
                days.add(String(w.date).slice(0, 10));
                return days.size <= 2;
            });
        })
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
