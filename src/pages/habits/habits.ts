import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

@Component({})
class HabitsPage extends Vue {

    habits: any[] = [];
    loading = false;
    adding = false;

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
