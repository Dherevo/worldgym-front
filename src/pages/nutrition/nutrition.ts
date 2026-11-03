import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import EnergyBar from "@/components/energy-bar/energy-bar.vue";
import localDate from "@/modules/localDate";
import { loadEnergyDay } from "@/modules/energyDay";
import userStore from "@/modules/userStore";
import { proteinRange } from "@/modules/calories";
import type { EnergyDay } from "@/modules/energyDay";

const MEALS = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];

// Food diary of a day next to what was burned, plus the follow-up of the last days
@Component({ components: { EnergyBar } })
class NutritionPage extends Vue {

    readonly meals = MEALS;
    date = localDate();
    day: EnergyDay | null = null;
    loading = false;
    history: any[] = [];
    recent: any[] = [];
    weighDue = false;

    // Form to add (or edit) food in a meal
    adding: string | null = null;
    editingId: number | null = null;
    name = '';
    kcal: number | string = '';
    protein: number | string = '';
    saving = false;

    created() {
        this.load();
        this.loadRecent();
        this.checkWeight();
    }

    // Protein target for the goal of the day, and how much of it is eaten
    get proteinGoal(): { min: number; max: number; ref: number } | null {
        return this.day?.ready ? proteinRange(userStore.data, this.day.goal) : null;
    }

    // General recommendation of total water a day: 2.5 L for men, 2 L for women (EFSA)
    get waterLiters(): string {
        return userStore.data?.gender === 'female' ? '2' : translate.currentLanguage === 'en' ? '2.5' : '2,5';
    }

    get proteinPct(): number {
        const g = this.proteinGoal;
        return g && this.day ? Math.min(100, Math.round((this.day.protein / g.max) * 100)) : 0;
    }

    get isToday(): boolean {
        return this.date === localDate();
    }

    get dateLabel(): string {
        if (this.isToday) return translate.get('nutrition.today');
        return new Date(this.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    }

    shiftDay(n: number) {
        const d = new Date(this.date + 'T00:00:00');
        d.setDate(d.getDate() + n);
        const next = localDate(d);
        if (next > localDate()) return;
        this.date = next;
        this.adding = null;
        this.load();
    }

    load() {
        this.loading = true;
        const date = this.date;
        loadEnergyDay(date)
        .then(day => { if (date === this.date) this.day = day; })
        .catch(() => App.notification(translate.get('nutrition.errors.load')).setType('error').show())
        .finally(() => { this.loading = false; this.loadHistory(); });
    }

    loadHistory() {
        http.get('/nutrition/history').data({ days: 14 })
        .then((res: any) => { this.history = res.items ?? []; })
        .catch(() => {});
    }

    loadRecent() {
        http.get('/nutrition/recent')
        .then((res: any) => { this.recent = res.items ?? []; })
        .catch(() => {});
    }

    // A weight at least once a week keeps the calculation honest
    checkWeight() {
        http.get('/measurements')
        .then((res: any) => {
            const last = (res.items ?? []).at(-1)?.date;
            const days = last ? (Date.now() - new Date(last + 'T00:00:00').getTime()) / 86400000 : Infinity;
            this.weighDue = days >= 7;
        })
        .catch(() => {});
    }

    entriesOf(meal: string): any[] {
        return (this.day?.entries ?? []).filter(e => e.meal === meal);
    }

    subtotal(meal: string): number {
        return this.entriesOf(meal).reduce((sum, e) => sum + e.kcal, 0);
    }

    openAdd(meal: string) {
        this.adding = meal;
        this.editingId = null;
        this.name = '';
        this.kcal = '';
        this.protein = '';
    }

    openEdit(e: any) {
        this.adding = e.meal;
        this.editingId = e.id;
        this.name = e.name;
        this.kcal = e.kcal;
        this.protein = e.protein_g ?? '';
    }

    // Repeat something eaten before with one tap
    useRecent(r: any) {
        this.name = r.name;
        this.kcal = r.kcal;
        this.protein = r.protein_g ?? '';
    }

    get canSave(): boolean {
        const k = Number(this.kcal);
        return !!this.name.trim() && this.kcal !== '' && Number.isInteger(k) && k >= 0 && k <= 5000;
    }

    save() {
        if (!this.canSave || this.saving || !this.adding) return;
        this.saving = true;
        const data: any = { meal: this.adding, name: this.name.trim(), kcal: Number(this.kcal), protein_g: this.protein === '' ? null : Number(this.protein) };
        const req = this.editingId
            ? http.put(`/nutrition/entries/${this.editingId}`).data(data)
            : http.post('/nutrition/entries').data({ ...data, date: this.date });
        req.then(() => { this.adding = null; this.editingId = null; this.refresh(); })
        .catch(() => App.notification(translate.get('nutrition.errors.save')).setType('error').show())
        .finally(() => { this.saving = false; });
    }

    remove(e: any) {
        http.delete(`/nutrition/entries/${e.id}`)
        .then(() => this.refresh())
        .catch(() => App.notification(translate.get('nutrition.errors.delete')).setType('error').show());
    }

    refresh() {
        this.load();
        this.loadRecent();
    }

    historyLabel(date: string): string {
        return new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    }

    // Eaten minus burned of a day; null when what was burned was not saved
    balance(h: any): number | null {
        return h.energy ? h.kcal - h.energy.burned : null;
    }

    balanceLabel(h: any): string {
        const b = this.balance(h);
        return b === null ? '' : (b > 0 ? '+' : '') + b;
    }
}
export default toNative(NutritionPage);
