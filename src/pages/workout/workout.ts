import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import localDate from "@/modules/localDate";
import SectionTile from "@/components/section-tile/section-tile.vue";

type State = 'loading' | 'pick-exercise' | 'idle' | 'active' | 'logging' | 'resting' | 'choose' | 'abs-offer' | 'done';

@Component({ components: { SectionTile } })
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

    // Routine workouts: extra exercise panel and exercises skipped in earlier sessions
    showAdd = false;
    showPending = false;
    pendingItems: any[] = [];

    // Historial últimes sessions de l'exercici actual
    exerciseHistory: any[] = [];
    lastSetsByEx: Record<number, any[]> = {};
    lastSetRef: { weId: number; id: number } | null = null;
    pendingRest: { weId: number; id: number; taken: number } | null = null;
    absOptions: any[] = [];
    absOffered = false;
    absPromise: Promise<any[]> | null = null;
    absWeId: number | null = null;
    restStartedAt = 0;
    exerciseRecord: { weight: number; reps: number } | null = null;

    // Sèries fetes en l'exercici actual (per mostrar taula live)
    loggedSets: any[] = [];

    // Resum final de l'entrenament
    completedExercises: any[] = [];

    // Daily must-dos done around the workout (warm-up, stretching) and the rating of the session
    habitsByKey: Record<string, any> = {};
    feedbackGiven: string | null = null;
    workoutStartedAt: string | null = null;
    activeSeconds: number | null = null;

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
        const secs = this.activeSeconds ?? Math.round((Date.now() - new Date(this.workoutStartedAt).getTime()) / 1000);
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
        this.fetchHabits();
        this.fetchPending();
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
                this.activeSeconds = res.active_seconds ?? null;
                this.state = 'done';
                return;
            }

            // Entrenament lliure si no té routine_day_id
            // A recommended session comes with its exercises planned, so it follows the guided flow too
            this.isFreeWorkout = !res.routine_day_id && !res.recommended;

            if (this.exercises.length === 0) {
                this.state = 'pick-exercise';
                return;
            }

            // Reconstruir posició sempre des de les dades del backend
            // (una sèrie és "feta" si té reps !== null)
            this.reconstructProgress();
            this.state = 'idle';
            this.loadExerciseHistory();
            this.loadAbsOptions();
        })
        .catch(() => {});
    }

    fetchPending() {
        http.get('/pending-exercises').data({ date: localDate() })
        .then((res: any) => { this.pendingItems = res.items ?? []; })
        .catch(() => { this.pendingItems = []; });
    }

    // Skipped exercises of earlier days that are not already in this workout
    get addSuggestions(): any[] {
        const inWorkout = new Set(this.exercises.map((e: any) => e.exercise?.id));
        return this.pendingItems.filter((p: any) => !inWorkout.has(p.exercise_id));
    }

    pendingWhen(date: string): string {
        const [y, m, d] = date.split('-').map(Number);
        const locale = ({ ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as any)[translate.currentLanguage] ?? 'ca-ES';
        return new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'long' });
    }

    // Extra exercises can be added at any moment between sets of a routine workout
    get canAdd(): boolean {
        return !this.isFreeWorkout && this.state === 'idle';
    }

    // Skipping or starting with another exercise only makes sense before the current one has sets logged
    get canReshuffle(): boolean {
        return this.canAdd && this.doneCount === 0;
    }

    persistOrder() {
        const order = this.exercises.map((we: any, i: number) => ({ id: we.id, order_index: i + 1 }));
        http.patch(`/workouts/${this.workoutId}/exercises/reorder`).data({ order })
        .catch(() => App.notification(translate.get('workout.errors.reorder')).setType('error').show());
    }

    // The planned order is the ideal one, but a machine can be busy: do this exercise now
    startWith(idx: number) {
        if (!this.canReshuffle || idx <= this.currentExerciseIdx || idx >= this.exercises.length) return;

        this.exercises.splice(this.currentExerciseIdx, 0, this.exercises.splice(idx, 1)[0]);
        this.persistOrder();
        this.exerciseHistory = [];
        this.exerciseRecord = null;
        this.loadExerciseHistory();
        this.saveProgress();
    }

    skipExercise() {
        if (!this.canReshuffle || !this.currentExercise) return;

        App.confirm(translate.get('workout.skip.confirm', { name: this.currentExercise.exercise?.name }))
        .then((ok: boolean) => {
            if (!ok) return;
            const we = this.currentExercise;
            http.delete(`/workouts/${this.workoutId}/exercises/${we.id}`)
            .then(() => {
                this.exercises.splice(this.currentExerciseIdx, 1);
                this.exerciseHistory = [];
                this.exerciseRecord = null;
                if (this.currentExerciseIdx >= this.exercises.length) {
                    this.finishOrOfferAbs();
                } else {
                    this.loadExerciseHistory();
                    this.saveProgress();
                }
            })
            .catch(() => App.notification(translate.get('workout.errors.skip')).setType('error').show());
        });
    }

    // Routine exercise with planned sets left: the user wants to move on after fewer sets
    get canFinishEarly(): boolean {
        return !this.isFreeWorkout && this.doneCount > 0 && this.totalSets > this.doneCount;
    }

    // Keeps the sets already logged, drops the planned ones that were never done, and goes to the next exercise
    finishExerciseEarly() {
        const we = this.currentExercise;
        if (!this.canFinishEarly || !we) return;

        if (this.restInterval) clearInterval(this.restInterval);
        this.restInterval = null;
        this.releaseWakeLock();

        const unused = (we.sets ?? []).slice(this.doneCount).filter((s: any) => s.id && s.reps === null);
        Promise.all(unused.map((s: any) => http.delete(`/workouts/${this.workoutId}/exercises/${we.id}/sets/${s.id}`)))
        .catch(() => App.notification(translate.get('workout.errors.saveSet')).setType('error').show())
        .finally(() => {
            we.sets = (we.sets ?? []).slice(0, this.doneCount);
            this.nextExercise();
        });
    }

    openAdd() {
        this.exerciseQuery = '';
        this.exerciseResults = [];
        this.showAdd = true;
    }

    closeAdd() {
        this.showAdd = false;
    }

    // Added right after the current exercise (use the plan list to do it first)
    addExercise(ex: any) {
        if (this.addingExercise) return;
        this.addingExercise = true;
        http.post(`/workouts/${this.workoutId}/exercises`)
        .data({ exercise_id: ex.id })
        .then((res: any) => {
            this.exercises.splice(this.currentExerciseIdx + 1, 0, { ...res, sets: res.sets ?? [] });
            this.persistOrder();
            this.exerciseQuery = '';
            this.exerciseResults = [];
            this.showAdd = false;
            this.showPending = false;
            this.saveProgress();
        })
        .catch(() => App.notification(translate.get('workout.errors.addExercise')).setType('error').show())
        .finally(() => { this.addingExercise = false; });
    }

    finishRoutine() {
        this.flushRest();
        http.put(`/workouts/${this.workoutId}`)
        .data({ status: 'finished', finished_at: new Date().toISOString() })
        .then((res: any) => { this.activeSeconds = res?.active_seconds ?? null; })
        .catch(() => {});
        this.clearProgress();
        this.state = 'done';
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
                const doneId = this.exercises[i].exercise?.id;
                if (doneId) this.loadLastSets(doneId);
            } else {
                // Exercici actual: algunes o cap sèrie feta
                this.currentExerciseIdx = i;
                this.loggedSets = logged;
                this.doneCount = logged.length;
                break;
            }
        }
    }

    // Sèrie número `idx` (0-based) de l'últim entrenament, o null si no en va fer tantes
    previousSet(idx: number, exerciseId?: number): any | null {
        return this.lastSetsFor(exerciseId ?? this.currentExercise?.exercise?.id)[idx] ?? null;
    }

    // What the user did in this same set the last time, to know where to start: "12 reps × 70 kg"
    get lastTimeLabel(): string | null {
        const prev = this.previousSet(this.doneCount);
        if (!prev || Number(prev.reps) <= 0) return null;
        const weight = Number(prev.weight) || 0;
        return weight > 0
            ? translate.get('workout.card.lastTime', { reps: Number(prev.reps), weight })
            : translate.get('workout.card.lastTimeBodyweight', { reps: Number(prev.reps) });
    }

    // Set to compare with: the same set number of the last workout
    prevFor(i: number, _sets: any[], exerciseId?: number): any | null {
        return this.previousSet(i, exerciseId);
    }

    // Short difference text: "(+2)", "(-5 kg)", "(=)" or "" when there is nothing to compare with
    compareText(cur: any, prevValue: any, unit = ''): string {
        if (prevValue === null || prevValue === undefined) return '';
        const d = Math.round(((Number(cur) || 0) - (Number(prevValue) || 0)) * 100) / 100;
        if (d === 0) return '(=)';
        return `(${d > 0 ? '+' : ''}${d}${unit ? ' ' + unit.trim() : ''})`;
    }

    lastSetsFor(exerciseId?: number): any[] {
        return (exerciseId && this.lastSetsByEx[exerciseId]) || [];
    }

    loadLastSets(exerciseId: number) {
        if (this.lastSetsByEx[exerciseId]) return;
        http.get(`/stats/exercises/${exerciseId}/last-sets`).data({ exclude_workout_id: this.workoutId })
        .then((res: any) => { this.lastSetsByEx[exerciseId] = res.sets ?? []; })
        .catch(() => {});
    }

    loadExerciseHistory() {
        const exerciseId = this.currentExercise?.exercise?.id;
        if (!exerciseId) { this.exerciseHistory = []; this.exerciseRecord = null; return; }
        this.loadLastSets(exerciseId);
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

    // --- ESCALFAMENT, ESTIRAMENTS I FEEDBACK ---

    fetchHabits() {
        http.get('/habits').data({ date: localDate() })
        .then((res: any) => {
            const map: Record<string, any> = {};
            for (const h of res.habits ?? []) if (h.key) map[h.key] = h;
            this.habitsByKey = map;
        })
        .catch(() => {});
    }

    markHabit(key: string) {
        const h = this.habitsByKey[key];
        if (!h) return;
        http.put(`/habits/${h.id}/log`).data({ date: localDate(), completed: true })
        .then(() => this.fetchHabits())
        .catch(() => {});
    }

    get showGeneralWarmup(): boolean {
        const h = this.habitsByKey.warmup;
        return this.state === 'idle' && this.currentExerciseIdx === 0 && this.doneCount === 0 && !!h && !h.log?.completed;
    }

    // Abdominals: optional extra at the end of every routine workout (always on; it logs the abs habit behind the scenes)
    get absHabit(): any | null {
        return this.habitsByKey.abs ?? null;
    }

    // Before closing a routine workout, offer an abdominals exercise (any exercise of the Core group) once
    // Exercises of the Core group, loaded in the background while training so the offer appears instantly
    loadAbsOptions(): Promise<any[]> {
        if (!this.absPromise) {
            this.absPromise = http.get('/muscle-groups')
            .then((res: any) => {
                const core = (res.items ?? []).find((g: any) => String(g.name).toLowerCase() === 'core');
                return core ? http.get('/exercises').data({ muscle_group_id: core.id, pageSize: 60 }) : { items: [] };
            })
            .then((res: any) => { this.absOptions = res.items ?? []; return this.absOptions; })
            .catch(() => [] as any[]);
        }
        return this.absPromise as Promise<any[]>;
    }

    finishOrOfferAbs() {
        const h = this.absHabit;
        if (this.isFreeWorkout || this.absOffered || !h || h.log?.completed) { this.finishRoutine(); return; }

        this.absOffered = true;
        if (!this.absOptions.length) this.state = 'loading';
        this.loadAbsOptions().then((options: any[]) => {
            if (options.length) this.state = 'abs-offer';
            else this.finishRoutine();
        });
    }

    chooseAbs(ex: any) {
        if (this.addingExercise) return;
        this.addingExercise = true;
        http.post(`/workouts/${this.workoutId}/exercises`).data({ exercise_id: ex.id })
        .then((res: any) => {
            this.exercises.push({ ...res, sets: res.sets ?? [] });
            this.absWeId = res.id;
            this.currentExerciseIdx = this.exercises.length - 1;
            this.doneCount = 0;
            this.loggedSets = [];
            this.loadExerciseHistory();
            this.state = 'idle';
            this.saveProgress();
        })
        .catch(() => App.notification(translate.get('workout.errors.addExercise')).setType('error').show())
        .finally(() => { this.addingExercise = false; });
    }

    // The abdominals habit counts as done once the abdominals exercise has sets logged
    markAbsDone() {
        const h = this.absHabit;
        const we = this.currentExercise;
        if (!h || !we || we.id !== this.absWeId || !this.loggedSets.length) return;
        const last = this.loggedSets[this.loggedSets.length - 1];
        http.put(`/habits/${h.id}/log`).data({ date: localDate(), completed: true, sets_done: this.loggedSets.length, reps: last.reps })
        .then(() => this.fetchHabits())
        .catch(() => {});
    }

    get stretchHabit(): any | null {
        return this.habitsByKey.stretch ?? null;
    }

    muscleGroupOf(we: any): number | null {
        const muscles = we?.exercise?.muscles ?? [];
        const primary = muscles.find((m: any) => m.pivot?.is_primary) ?? muscles[0];
        return primary?.muscle_group_id ?? null;
    }

    // Ramp-up sets (40/60/80% of the working weight) before the first exercise of each muscle group
    get warmupSets(): { weight: number; reps: number }[] {
        const we = this.currentExercise;
        if (!we || this.isBodyweight || this.doneCount !== 0 || this.state !== 'idle') return [];

        const group = this.muscleGroupOf(we);
        if (group === null) return [];
        if (this.exercises.slice(0, this.currentExerciseIdx).some((e: any) => this.muscleGroupOf(e) === group)) return [];

        const work = Number(this.targetSet?.weight) || Number(this.exerciseHistory[0]?.max_weight) || 0;
        if (work <= 0) return [];

        return ([[40, 10], [60, 6], [80, 3]] as number[][])
            .map(([pct, reps]) => ({ weight: Math.round(work * pct / 100 / 2.5) * 2.5, reps }))
            .filter(s => s.weight > 0);
    }

    sendFeedback(value: string) {
        http.put(`/workouts/${this.workoutId}/feedback`).data({ feedback: value })
        .then(() => { this.feedbackGiven = value; })
        .catch(() => {});
    }

    // --- FLUX ---

    startSet() {
        this.captureRest();
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
        // First set: same set of the last workout; the next ones start from the set just done today
        const prev = lastLogged ?? this.previousSet(0);

        // The API sends decimals as strings ("20.00"): they must be numbers or "+" concatenates
        this.logReps = Number(prev?.reps ?? this.targetSet?.reps_target ?? this.targetSet?.reps ?? 12) || 12;
        this.logWeight = this.isBodyweight ? 0 : (Number(prev?.weight ?? this.targetSet?.weight ?? lastSessionWeight) || 0);
        this.logNotes = '';
        this.logFailed = false;
        this.logDropset = false;
        this.state = 'logging';
        this.releaseWakeLock();
    }

    submitSet() {
        this.flushRest();
        const we = this.currentExercise;
        const target = this.targetSet;
        const restSecs = target?.rest_seconds ?? 90;
        this.savingSet = true;

        const req = target?.id
            ? http.put(`/workouts/${this.workoutId}/exercises/${we.id}/sets/${target.id}`)
              .data({ reps: this.logReps, weight: this.logWeight, rest_seconds: restSecs, duration_seconds: this.exerciseSeconds, notes: this.logNotes, is_failed: this.logFailed, is_dropset: this.logDropset })
            : http.post(`/workouts/${this.workoutId}/exercises/${we.id}/sets`)
              .data({ set_number: this.doneCount + 1, reps: this.logReps, weight: this.logWeight, rest_seconds: restSecs, duration_seconds: this.exerciseSeconds, notes: this.logNotes, is_failed: this.logFailed, is_dropset: this.logDropset });

        req.then((res: any) => {
            this.lastSetRef = { weId: we.id, id: target?.id ?? res?.id };
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

    // Real rest = time from logging a set to starting the next one. Computed locally when the next set
    // starts and sent later with the next save, so skipping the rest never waits for the backend
    captureRest() {
        const ref = this.lastSetRef;
        if (!ref?.id || !this.restStartedAt) return;
        this.pendingRest = { weId: ref.weId, id: ref.id, taken: Math.max(0, Math.round((Date.now() - this.restStartedAt) / 1000)) };
        this.lastSetRef = null;
        this.restStartedAt = 0;
    }

    flushRest() {
        const p = this.pendingRest;
        if (!p) return;
        this.pendingRest = null;
        http.put(`/workouts/${this.workoutId}/exercises/${p.weId}/sets/${p.id}`).data({ rest_seconds: p.taken }).catch(() => {});
    }

    startRest(seconds: number) {
        this.restStartedAt = Date.now();
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
        // Planned sets done: let the user add an extra set or move on (never jump on its own)
        if (this.totalSets === -1 || this.doneCount >= this.totalSets) {
            this.state = 'choose';
        } else {
            this.state = 'idle';
        }
    }

    continueSet() {
        this.state = 'idle';
    }

    nextExercise() {
        // Guardar l'exercici actual al resum final (sempre, per mantenir índexos alineats)
        this.markAbsDone();
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
                this.finishOrOfferAbs();
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
                this.flushRest();
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
