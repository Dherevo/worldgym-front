import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

type State = 'loading' | 'pick-exercise' | 'idle' | 'active' | 'logging' | 'resting' | 'choose' | 'done';

@Component({})
class WorkoutPage extends Vue {

    workout: any = null;
    exercises: any[] = [];
    state: State = 'loading';
    isFreeWorkout: boolean = false;

    currentExerciseIdx = 0;
    doneCount = 0;

    wakeLock: any = null;

    // Timer exercici (compta amunt)
    exerciseSeconds = 0;
    exerciseInterval: any = null;

    // Timer descans (compta avall)
    restSeconds = 0;
    restInterval: any = null;

    // Formulari de log
    logReps = 10;
    logWeight = 0;
    logNotes = '';
    logFailed = false;
    logDropset = false;
    savingSet = false;

    // Cercador d'exercicis (entrenament lliure)
    allExercises: any[] = [];
    exerciseQuery = '';
    exerciseResults: any[] = [];
    addingExercise: boolean = false;

    // Historial últimes sessions de l'exercici actual
    exerciseHistory: any[] = [];
    exerciseRecord: { weight: number; reps: number } | null = null;

    // Sèries fetes en l'exercici actual (per mostrar taula live)
    loggedSets: any[] = [];

    // Resum final de l'entrenament
    completedExercises: any[] = [];
    workoutStartedAt: string | null = null;

    get workoutId() { return this.param('id'); }

    get currentExercise() { return this.exercises[this.currentExerciseIdx] ?? null; }

    get targetSet() {
        return this.currentExercise?.sets?.[this.doneCount] ?? null;
    }

    get isBodyweight() {
        return this.currentExercise?.exercise?.is_bodyweight ?? false;
    }

    get totalSets() {
        const sets = this.currentExercise?.sets ?? [];
        return sets.length > 0 ? sets.length : -1;
    }

    get exerciseFormatted() {
        const m = Math.floor(this.exerciseSeconds / 60);
        const s = this.exerciseSeconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    get restFormatted() {
        const m = Math.floor(this.restSeconds / 60);
        const s = this.restSeconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    get workoutDuration(): string {
        if (!this.workoutStartedAt) return '';
        const secs = Math.round((Date.now() - new Date(this.workoutStartedAt).getTime()) / 1000);
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        if (h > 0) return translate.get('workout.duration.hoursMinutes', { h, m });
        return translate.get('workout.duration.minutes', { m });
    }

    get targetRestLabel() {
        const secs = this.targetSet?.rest_seconds ?? 0;
        if (!secs) return null;
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        let time: string;
        if (m === 0) time = translate.get('workout.restTime.seconds', { s });
        else if (s === 0) time = translate.get('workout.restTime.minutes', { m });
        else time = translate.get('workout.restTime.minutesSeconds', { m, s });
        return translate.get('workout.card.restLabel', { time });
    }

    created() {
        this.fetchWorkout();
        this.fetchExerciseList();
    }

    unmounted() {
        if (this.exerciseInterval) clearInterval(this.exerciseInterval);
        if (this.restInterval) clearInterval(this.restInterval);
        this.releaseWakeLock();
        this.saveProgress();
    }

    fetchWorkout() {
        this.state = 'loading';
        http.get(`/workouts/${this.workoutId}`)
        .then((res: any) => {
            this.workout = res;
            this.workoutStartedAt = res.started_at ?? new Date().toISOString();
            this.exercises = (res.workout_exercises ?? []).map((we: any) => ({
                ...we,
                sets: we.sets ?? []
            }));

            // Workout ja finalitzat
            if (res.status === 'finished') {
                this.state = 'done';
                return;
            }

            // Entrenament lliure si no té routine_day_id
            this.isFreeWorkout = !res.routine_day_id;

            if (this.exercises.length === 0) {
                this.state = 'pick-exercise';
                return;
            }

            // Reconstruir posició sempre des de les dades del backend
            // (una sèrie és "feta" si té reps !== null)
            this.reconstructProgress();
            this.state = 'idle';
            this.loadExerciseHistory();
        })
        .catch(() => {});
    }

    reconstructProgress() {
        this.completedExercises = [];
        this.loggedSets = [];
        this.currentExerciseIdx = 0;
        this.doneCount = 0;

        for (let i = 0; i < this.exercises.length; i++) {
            const sets = this.exercises[i].sets ?? [];
            const logged = sets.filter((s: any) => s.reps !== null);

            if (logged.length === sets.length && sets.length > 0 && i < this.exercises.length - 1) {
                // Totes les sèries fetes i no és l'últim exercici → completat
                this.completedExercises.push({
                    name: this.exercises[i].exercise?.name,
                    sets: logged,
                });
                this.currentExerciseIdx = i + 1;
            } else {
                // Exercici actual: algunes o cap sèrie feta
                this.currentExerciseIdx = i;
                this.loggedSets = logged;
                this.doneCount = logged.length;
                break;
            }
        }
    }

    loadExerciseHistory() {
        const exerciseId = this.currentExercise?.exercise?.id;
        if (!exerciseId) { this.exerciseHistory = []; this.exerciseRecord = null; return; }
        http.get(`/stats/exercises/${exerciseId}`)
        .then((res: any) => {
            const sessions = res.sessions ?? [];
            this.exerciseHistory = sessions.slice(-2).reverse(); // les 2 més recents, primer la última
            // Calcular rècord de pes de totes les sessions
            let maxWeight = 0;
            let maxReps = 0;
            sessions.forEach((s: any) => {
                const w = parseFloat(s.max_weight) || 0;
                if (w > maxWeight) {
                    maxWeight = w;
                    maxReps = Math.round(parseFloat(s.max_reps ?? s.avg_reps) || 0);
                }
            });
            this.exerciseRecord = maxWeight > 0 ? { weight: maxWeight, reps: maxReps } : null;
        })
        .catch(() => { this.exerciseHistory = []; this.exerciseRecord = null; });
    }

    fetchExerciseList() {
        http.get('/exercises?pageSize=2000')
        .then((res: any) => { this.allExercises = res.items ?? []; })
        .catch(() => {});
    }

    filterExercises() {
        const q = this.exerciseQuery.toLowerCase();
        this.exerciseResults = q
            ? this.allExercises.filter(e => e.name.toLowerCase().includes(q)).slice(0, 8)
            : this.allExercises.slice(0, 8);
    }

    pickExercise(ex: any) {
        this.addingExercise = true;
        http.post(`/workouts/${this.workoutId}/exercises`)
        .data({ exercise_id: ex.id })
        .then((res: any) => {
            const we = { ...res, sets: [] };
            this.exercises.push(we);
            this.currentExerciseIdx = this.exercises.length - 1;
            this.doneCount = 0;
            this.exerciseQuery = '';
            this.exerciseResults = [];
            this.loadExerciseHistory();
            this.state = 'idle';
        })
        .catch(() => App.notification(translate.get('workout.errors.addExercise')).setType('error').show())
        .finally(() => { this.addingExercise = false; });
    }

    // --- FLUX ---

    startSet() {
        this.exerciseSeconds = 0;
        this.state = 'active';
        this.exerciseInterval = setInterval(() => { this.exerciseSeconds++; }, 1000);
        this.acquireWakeLock();
    }

    stopSet() {
        clearInterval(this.exerciseInterval);
        this.exerciseInterval = null;

        const lastLogged = this.loggedSets.length > 0 ? this.loggedSets[this.loggedSets.length - 1] : null;
        const lastSessionWeight = this.exerciseHistory.length > 0 ? (parseFloat(this.exerciseHistory[0]?.max_weight) || 0) : 0;

        this.logReps = this.targetSet?.reps ?? lastLogged?.reps ?? 12;
        this.logWeight = this.isBodyweight ? 0 : (this.targetSet?.weight ?? lastLogged?.weight ?? lastSessionWeight);
        this.logNotes = '';
        this.logFailed = false;
        this.logDropset = false;
        this.state = 'logging';
        this.releaseWakeLock();
    }

    submitSet() {
        const we = this.currentExercise;
        const target = this.targetSet;
        const restSecs = target?.rest_seconds ?? 90;
        this.savingSet = true;

        const req = target?.id
            ? http.put(`/workouts/${this.workoutId}/exercises/${we.id}/sets/${target.id}`)
              .data({ reps: this.logReps, weight: this.logWeight, rest_seconds: restSecs, notes: this.logNotes, is_failed: this.logFailed, is_dropset: this.logDropset })
            : http.post(`/workouts/${this.workoutId}/exercises/${we.id}/sets`)
              .data({ set_number: this.doneCount + 1, reps: this.logReps, weight: this.logWeight, rest_seconds: restSecs, notes: this.logNotes, is_failed: this.logFailed, is_dropset: this.logDropset });

        req.then(() => {
            this.loggedSets.push({
                set_number: this.doneCount + 1,
                reps: this.logReps,
                weight: this.logWeight,
                notes: this.logNotes,
                is_failed: this.logFailed,
                is_dropset: this.logDropset,
            });
            this.doneCount++;
            this.saveProgress();
            this.startRest(restSecs);
        })
        .catch(() => App.notification(translate.get('workout.errors.saveSet')).setType('error').show())
        .finally(() => { this.savingSet = false; });
    }

    startRest(seconds: number) {
        this.restSeconds = seconds;
        this.state = 'resting';
        this.acquireWakeLock();
        this.restInterval = setInterval(() => {
            if (this.restSeconds > 0) {
                this.restSeconds--;
            } else {
                clearInterval(this.restInterval);
                this.restInterval = null;
                this.releaseWakeLock();
                this.vibrate();
                this.afterRest();
            }
        }, 1000);
    }

    adjustRest(delta: number) {
        this.restSeconds = Math.max(0, this.restSeconds + delta);
    }

    skipRest() {
        if (this.restInterval) clearInterval(this.restInterval);
        this.restInterval = null;
        this.releaseWakeLock();
        this.afterRest();
    }

    afterRest() {
        // Without planned sets (free workout, or a routine exercise with no sets target) there is
        // no count to finish at, so ask instead of offering another set forever
        if (this.totalSets === -1) {
            this.state = 'choose';
        } else if (this.doneCount < this.totalSets) {
            this.state = 'idle';
        } else {
            this.nextExercise();
        }
    }

    continueSet() {
        this.state = 'idle';
    }

    nextExercise() {
        // Guardar l'exercici actual al resum final (sempre, per mantenir índexos alineats)
        if (this.currentExercise) {
            this.completedExercises.push({
                name: this.currentExercise.exercise?.name,
                sets: [...this.loggedSets],
            });
        }
        this.doneCount = 0;
        this.exerciseHistory = [];
        this.exerciseRecord = null;
        this.loggedSets = [];
        if (this.isFreeWorkout) {
            // Entrenament lliure: sempre demanar quin és el següent exercici
            this.exerciseQuery = '';
            this.exerciseResults = [];
            this.state = 'pick-exercise';
            this.saveProgress();
        } else {
            this.currentExerciseIdx++;
            if (this.currentExerciseIdx >= this.exercises.length) {
                http.put(`/workouts/${this.workoutId}`)
                .data({ status: 'finished', finished_at: new Date().toISOString() })
                .catch(() => {});
                this.clearProgress();
                this.state = 'done';
            } else {
                this.loadExerciseHistory();
                this.state = 'idle';
                this.saveProgress();
            }
        }
    }

    formatHistoryDate(date: string) {
        return new Date(date).toLocaleDateString(({ ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as any)[translate.currentLanguage] ?? 'ca-ES', { day: 'numeric', month: 'short' });
    }

    finishWorkout() {
        App.confirm(translate.get('workout.finishConfirm'))
        .then((ok: boolean) => {
            if (ok) {
                http.put(`/workouts/${this.workoutId}`)
                .data({ status: 'finished', finished_at: new Date().toISOString() })
                .then(() => {})
                .catch(() => {})
                .finally(() => {
                    this.clearProgress();
                    this.to('/workouts');
                });
            }
        });
    }

    async acquireWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await (navigator as any).wakeLock.request('screen');
            }
        } catch { /* ignorat */ }
    }

    releaseWakeLock() {
        if (this.wakeLock) { this.wakeLock.release(); this.wakeLock = null; }
    }

    vibrate() {
        try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch { /* ignorat */ }
    }

    saveProgress() {
        if (!this.workoutId || this.state === 'loading') return;
        try {
            localStorage.setItem(`wg_workout_${this.workoutId}`, JSON.stringify({
                currentExerciseIdx: this.currentExerciseIdx,
                doneCount: this.doneCount,
                isFreeWorkout: this.isFreeWorkout,
            }));
        } catch { /* ignorat */ }
    }

    restoreProgress(): boolean {
        try {
            const saved = localStorage.getItem(`wg_workout_${this.workoutId}`);
            if (!saved) return false;
            const data = JSON.parse(saved);
            this.currentExerciseIdx = data.currentExerciseIdx ?? 0;
            this.doneCount = data.doneCount ?? 0;
            this.isFreeWorkout = data.isFreeWorkout ?? false;
            return true;
        } catch { return false; }
    }

    clearProgress() {
        try { localStorage.removeItem(`wg_workout_${this.workoutId}`); } catch { /* ignorat */ }
    }
}
export default toNative(WorkoutPage);
