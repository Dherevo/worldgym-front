import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import localDate from "@/modules/localDate";

@Component({})
class HabitsPage extends Vue {

    habits: any[] = [];
    loading = false;
    adding = false;

    // Habits created by the admin that the user can add to their list
    catalog: any[] = [];
    addingCatalogId: number | null = null;

    // Drag & drop reorder
    dragFromIdx: number | null = null;

    // History panel: one habit open at a time
    historyId: number | null = null;
    historyLoading = false;
    history: any = null;

    newName = '';
    newKind: 'sets' | 'check' = 'sets';
    newSets = '3';
    newReps = '15';
    newSchedule: 'daily' | 'weekdays' | 'interval' = 'daily';
    newDays: number[] = [1, 2, 3, 4, 5];
    newEvery = '2';

    created() {
        this.fetchHabits();
        this.fetchCatalog();
    }

    fetchHabits() {
        this.loading = true;
        http.get('/habits')
        .then((res: any) => { this.habits = res.habits ?? []; })
        .catch(() => App.notification(translate.get('habits.page.errors.load')).setType('error').show())
        .finally(() => { this.loading = false; });
    }

    fetchCatalog() {
        http.get('/habit-catalog')
        .then((res: any) => { this.catalog = res.templates ?? []; })
        .catch(() => {});
    }

    // The copy is the user's own from then on: they can adjust or delete it like any custom habit
    addFromCatalog(t: any) {
        if (this.addingCatalogId !== null) return;
        this.addingCatalogId = t.id;

        http.post(`/habit-catalog/${t.id}/add`).data({})
        .then((res: any) => {
            this.habits = res.habits ?? [];
            this.catalog = res.catalog ?? [];
        })
        .catch(() => {
            App.notification(translate.get('habits.page.errors.add')).setType('error').show();
            this.fetchCatalog();
        })
        .finally(() => { this.addingCatalogId = null; });
    }

    catalogGoal(t: any): string {
        if (t.kind === 'steps') return translate.get('habits.page.catalog.goalSteps', { n: t.target_value });
        if (t.kind === 'sets') return translate.get('habits.page.catalog.goalSets', { sets: t.target_sets, reps: t.target_reps });
        return translate.get('habits.page.catalog.goalCheck');
    }

    catalogSchedule(t: any): string {
        if (t.schedule_type === 'weekdays') return (t.schedule_days ?? []).map((d: number) => translate.get('habits.page.days.' + d)).join(' ');
        if (t.schedule_type === 'interval') return `${translate.get('habits.page.schedule.every')} ${t.schedule_every} ${translate.get('habits.page.schedule.days')}`;
        return translate.get('habits.page.schedule.daily');
    }

    habitName(h: any): string {
        return h.name ?? translate.get(`habits.names.${h.key}`);
    }

    // Weekdays are ISO numbers: 1 = Monday ... 7 = Sunday
    onScheduleType(h: any, event: Event) {
        const type = (event.target as HTMLSelectElement).value;
        if (type === 'weekdays') {
            this.update(h, { schedule_type: 'weekdays', schedule_days: h.schedule_days?.length ? h.schedule_days : [1, 2, 3, 4, 5] });
        } else if (type === 'interval') {
            this.update(h, { schedule_type: 'interval', schedule_every: h.schedule_every ?? 2, schedule_start: localDate() });
        } else {
            this.update(h, { schedule_type: 'daily' });
        }
    }

    toggleDay(h: any, day: number) {
        const days: number[] = h.schedule_days ?? [];
        const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort();
        if (!next.length) return;
        this.update(h, { schedule_type: 'weekdays', schedule_days: next });
    }

    onEvery(h: any, event: Event) {
        const value = Number((event.target as HTMLInputElement).value);
        if (!value) return;
        // Keeps the anchor day, so changing N does not shift the cycle
        this.update(h, { schedule_type: 'interval', schedule_every: value, schedule_start: h.schedule_start ?? localDate() });
    }

    toggleNewDay(day: number) {
        this.newDays = this.newDays.includes(day) ? this.newDays.filter(d => d !== day) : [...this.newDays, day].sort();
    }

    // Saves one field of a habit; the response carries the refreshed list
    update(h: any, body: any) {
        http.put(`/habits/${h.id}`).data(body)
        .then((res: any) => { this.habits = res.habits ?? []; })
        .catch((e: any) => {
            const key = e?.data?.error === 'target.invalid' ? 'target' : 'save';
            App.notification(translate.get(`habits.page.errors.${key}`)).setType('error').show();
            this.fetchHabits();
        });
    }

    onNumber(h: any, field: string, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        if (value === '') return;
        this.update(h, { [field]: Number(value) });
    }

    onActive(h: any, event: Event) {
        this.update(h, { is_active: (event.target as HTMLInputElement).checked });
    }

    remove(h: any) {
        App.confirm(translate.get('habits.page.confirmDelete', { name: this.habitName(h) }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/habits/${h.id}`)
            .then((res: any) => {
                this.habits = res.habits ?? [];
                this.fetchCatalog();
            })
            .catch(() => App.notification(translate.get('habits.page.errors.delete')).setType('error').show());
        });
    }

    dragStart(idx: number) {
        this.dragFromIdx = idx;
    }

    dropOn(idx: number) {
        if (this.dragFromIdx === null || this.dragFromIdx === idx) return;
        const moved = this.habits.splice(this.dragFromIdx, 1)[0];
        this.habits.splice(idx, 0, moved);
        this.dragFromIdx = null;

        const order = this.habits.map((h: any, i: number) => ({ id: h.id, order_index: i + 1 }));
        http.patch('/habits/reorder').data({ order })
        .catch(() => {
            App.notification(translate.get('habits.page.errors.reorder')).setType('error').show();
            this.fetchHabits();
        });
    }

    dragEnd() {
        this.dragFromIdx = null;
    }

    toggleHistory(h: any) {
        if (this.historyId === h.id) {
            this.historyId = null;
            this.history = null;
            return;
        }

        this.historyId = h.id;
        this.history = null;
        this.historyLoading = true;
        http.get(`/habits/${h.id}/history`).data({ to: localDate() })
        .then((res: any) => { if (this.historyId === h.id) this.history = res; })
        .catch(() => {
            this.historyId = null;
            App.notification(translate.get('habits.page.errors.history')).setType('error').show();
        })
        .finally(() => { this.historyLoading = false; });
    }

    // Last 30 days oldest first: done / missed (logged but not completed) / empty
    get historyCells(): any[] {
        if (!this.history) return [];
        const byDate: Record<string, any> = {};
        for (const d of this.history.days ?? []) byDate[d.date] = d;
        const due = new Set<string>(this.history.due_dates ?? []);

        const [y, m, d] = (this.history.to as string).split('-').map(Number);
        const cells = [];
        for (let i = 29; i >= 0; i--) {
            const day = new Date(y, m - 1, d - i);
            const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            const log = byDate[key];
            cells.push({ date: key, day: day.getDate(), state: log ? (log.completed ? 'done' : 'missed') : (due.has(key) ? 'empty' : 'off') });
        }
        return cells;
    }

    get canAdd(): boolean {
        if (!this.newName.trim()) return false;
        if (this.newSchedule === 'weekdays' && !this.newDays.length) return false;
        if (this.newSchedule === 'interval' && !(Number(this.newEvery) >= 2 && Number(this.newEvery) <= 30)) return false;
        return this.newKind === 'check' || (Number(this.newSets) >= 1 && Number(this.newReps) >= 1);
    }

    add() {
        if (!this.canAdd || this.adding) return;
        this.adding = true;

        const body: any = { name: this.newName.trim(), kind: this.newKind };
        if (this.newKind === 'sets') {
            body.target_sets = Number(this.newSets);
            body.target_reps = Number(this.newReps);
        }

        body.schedule_type = this.newSchedule;
        if (this.newSchedule === 'weekdays') body.schedule_days = this.newDays;
        if (this.newSchedule === 'interval') {
            body.schedule_every = Number(this.newEvery);
            body.schedule_start = localDate();
        }

        http.post('/habits').data(body)
        .then((res: any) => {
            this.habits = res.habits ?? [];
            this.newName = '';
            this.newSchedule = 'daily';
        })
        .catch(() => App.notification(translate.get('habits.page.errors.add')).setType('error').show())
        .finally(() => { this.adding = false; });
    }
}
export default toNative(HabitsPage);
