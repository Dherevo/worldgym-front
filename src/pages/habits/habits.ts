import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import localDate from "@/modules/localDate";

@Component({})
class HabitsPage extends Vue {

    habits: any[] = [];
    loading = false;
    adding = false;

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

    created() {
        this.fetchHabits();
    }

    fetchHabits() {
        this.loading = true;
        http.get('/habits')
        .then((res: any) => { this.habits = res.habits ?? []; })
        .catch(() => App.notification(translate.get('habits.page.errors.load')).setType('error').show())
        .finally(() => { this.loading = false; });
    }

    habitName(h: any): string {
        return h.name ?? translate.get(`habits.names.${h.key}`);
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
            .then((res: any) => { this.habits = res.habits ?? []; })
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
        (http as any).patch('/habits/reorder').data({ order })
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

        const [y, m, d] = (this.history.to as string).split('-').map(Number);
        const cells = [];
        for (let i = 29; i >= 0; i--) {
            const day = new Date(y, m - 1, d - i);
            const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            const log = byDate[key];
            cells.push({ date: key, day: day.getDate(), state: log ? (log.completed ? 'done' : 'missed') : 'empty' });
        }
        return cells;
    }

    get canAdd(): boolean {
        if (!this.newName.trim()) return false;
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

        http.post('/habits').data(body)
        .then((res: any) => {
            this.habits = res.habits ?? [];
            this.newName = '';
        })
        .catch(() => App.notification(translate.get('habits.page.errors.add')).setType('error').show())
        .finally(() => { this.adding = false; });
    }
}
export default toNative(HabitsPage);
