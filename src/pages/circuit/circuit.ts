import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import localDate from "@/modules/localDate";

type State = 'loading' | 'unavailable' | 'ready' | 'running' | 'saving' | 'saveError' | 'done';

// Timed circuit (AMRAP): the exercises of a routine day are done in order, again and again and without rest,
// until the countdown ends. Each "Fet" press counts one exercise; the sets are saved when the circuit ends.
@Component({})
class CircuitPage extends Vue {

    state: State = 'loading';
    day: any = null;

    workoutId: number | null = null;
    // exercise_id -> id of its exercise inside the workout
    workoutExercises: Record<string, number> = {};

    startedAt = 0;
    now = Date.now();
    timer: any = null;
    wakeLock: any = null;

    // Reps done by each completed exercise, in order: the circuit position is its length
    log: number[] = [];

    get routineId() { return this.param('routineId'); }
    get dayId() { return this.param('dayId'); }

    get exercises(): any[] { return this.day?.exercises ?? []; }
    get totalMs(): number { return (this.day?.circuit_minutes ?? 0) * 60000; }

    get remainingSeconds(): number {
        return Math.max(0, Math.ceil((this.startedAt + this.totalMs - this.now) / 1000));
    }

    get timeLabel(): string {
        const s = this.remainingSeconds;
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }

    get doneSteps(): number { return this.log.length; }
    get stepInRound(): number { return this.exercises.length ? this.doneSteps % this.exercises.length : 0; }
    get round(): number { return this.exercises.length ? Math.floor(this.doneSteps / this.exercises.length) + 1 : 1; }
    get completedRounds(): number { return this.exercises.length ? Math.floor(this.doneSteps / this.exercises.length) : 0; }
    get current(): any { return this.exercises[this.stepInRound] ?? null; }
    get next(): any { return this.exercises.length > 1 ? this.exercises[(this.stepInRound + 1) % this.exercises.length] : null; }

    // Times each exercise was done and its total reps, for the summary and the saved sets
    get totals(): { exercise: any; times: number; reps: number }[] {
        return this.exercises.map((ex, i) => {
            const times = Math.floor(this.doneSteps / this.exercises.length) + (i < this.stepInRound ? 1 : 0);
            return { exercise: ex, times, reps: times * (ex.reps_target || 0) };
        });
    }

    get elapsedSeconds(): number {
        return Math.max(0, Math.min(this.totalMs, this.now - this.startedAt) / 1000) | 0;
    }

    get storageKey(): string { return `wg_circuit_${this.routineId}_${this.dayId}`; }

    created() {
        http.get(`/routines/${this.routineId}/days/${this.dayId}`)
        .then((day: any) => {
            this.day = day;
            if (!day?.circuit_minutes || !this.exercises.length) { this.state = 'unavailable'; return; }
            this.state = this.restore() ? 'running' : 'ready';
            if (this.state === 'running') this.runTimer();
        })
        .catch(() => { this.state = 'unavailable'; });
    }

    unmounted() {
        this.stopTimer();
        this.releaseWakeLock();
    }

    start() {
        if (this.state !== 'ready') return;
        this.state = 'loading';
        http.post(`/routines/${this.routineId}/days/${this.dayId}/start`)
        .data({ date: localDate(), notes: this.day.name })
        .then((res: any) => {
            this.workoutId = res.id;
            this.workoutExercises = {};
            for (const we of res.workout_exercises ?? []) this.workoutExercises[String(we.exercise_id)] = we.id;
            this.log = [];
            this.startedAt = Date.now();
            this.now = this.startedAt;
            this.state = 'running';
            this.persist();
            this.runTimer();
        })
        .catch(() => {
            this.state = 'ready';
            App.notification(translate.get('circuit.errors.start')).setType('error').show();
        });
    }

    runTimer() {
        this.stopTimer();
        this.acquireWakeLock();
        this.timer = setInterval(() => {
            this.now = Date.now();
            if (this.state === 'running' && this.remainingSeconds <= 0) {
                this.vibrate([400, 150, 400, 150, 400]);
                this.finish();
            }
        }, 250);
    }

    stopTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }

    // One exercise of the circuit done
    done() {
        if (this.state !== 'running' || !this.current) return;
        this.log.push(Number(this.current.reps_target) || 0);
        this.vibrate([60]);
        this.persist();
    }

    // Take back the last "Fet" press
    undo() {
        if (this.state !== 'running' || !this.log.length) return;
        this.log.pop();
        this.persist();
    }

    finishEarly() {
        App.confirm(translate.get('circuit.confirmFinish'))
        .then((ok: boolean) => { if (ok) this.finish(); });
    }

    // Save one set per exercise (total reps) and close the workout
    finish() {
        if (this.state !== 'running' && this.state !== 'saveError') return;
        this.stopTimer();
        this.releaseWakeLock();
        this.now = Date.now();
        this.state = 'saving';

        const seconds = this.elapsedSeconds;
        const each = Math.round(seconds / Math.max(1, this.exercises.length));
        const rounds = this.completedRounds;

        const saves = this.totals
            .filter(t => t.times > 0 && this.workoutExercises[String(t.exercise.exercise_id)])
            .map(t => () => http.post(`/workouts/${this.workoutId}/exercises/${this.workoutExercises[String(t.exercise.exercise_id)]}/sets`)
                .data({ set_number: 1, reps: t.reps, weight: 0, rest_seconds: 0, duration_seconds: each, notes: translate.get('circuit.setNote', { times: t.times, reps: t.exercise.reps_target }) }));

        // In order, so a retry after a failure never repeats the sets that were already saved
        const run = async () => {
            while (this.saved < saves.length) {
                await saves[this.saved]();
                this.saved++;
            }
            await http.put(`/workouts/${this.workoutId}`)
                .data({ notes: translate.get('circuit.workoutNote', { name: this.day.name ?? '', minutes: this.day.circuit_minutes, rounds }), status: 'finished', finished_at: new Date().toISOString() });
        };

        run()
        .then(() => {
            try { localStorage.removeItem(this.storageKey); } catch { /* storage unavailable */ }
            this.state = 'done';
        })
        .catch(() => {
            this.state = 'saveError';
            App.notification(translate.get('circuit.errors.save')).setType('error').show();
        });
    }

    // Sets already saved, so retrying continues where it stopped
    saved = 0;

    retrySave() {
        this.finish();
    }

    persist() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({ workoutId: this.workoutId, workoutExercises: this.workoutExercises, startedAt: this.startedAt, log: this.log }));
        } catch { /* storage unavailable */ }
    }

    // Come back to a circuit that was running (page reloaded): only while its time has not run out
    restore(): boolean {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return false;
            const data = JSON.parse(saved);
            if (!data?.workoutId || !data.startedAt || Date.now() - data.startedAt > this.totalMs + 5 * 60000) {
                localStorage.removeItem(this.storageKey);
                return false;
            }
            this.workoutId = data.workoutId;
            this.workoutExercises = data.workoutExercises ?? {};
            this.startedAt = data.startedAt;
            this.log = data.log ?? [];
            this.now = Date.now();
            return true;
        } catch { return false; }
    }

    async acquireWakeLock() {
        try {
            if ('wakeLock' in navigator && !this.wakeLock) this.wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch { /* not available */ }
    }

    releaseWakeLock() {
        try { if (this.wakeLock) { this.wakeLock.release(); this.wakeLock = null; } } catch { /* ignore */ }
    }

    vibrate(pattern: number[]) {
        try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* not available */ }
    }

    durationLabel(seconds: number): string {
        return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    }
}
export default toNative(CircuitPage);
