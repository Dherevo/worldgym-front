import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import EnergyBar from "@/components/energy-bar/energy-bar.vue";
import localDate from "@/modules/localDate";
import { loadEnergyDay, recalcPastDay } from "@/modules/energyDay";
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
    recentQuery = '';
    weighDue = false;

    // Form to add (or edit) food in a meal
    adding: string | null = null;
    editingId: number | null = null;
    rows: { name: string; kcal: number | string; protein: number | string }[] = [{ name: '', kcal: '', protein: '' }];
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

    // Jump to a day of the history to see (or fix) what was eaten
    openDay(date: string) {
        if (date === this.date) return;
        this.date = date;
        this.adding = null;
        this.load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        .then((res: any) => { this.history = res.items ?? []; this.recalcHistory(); })
        .catch(() => {});
    }

    // One-time recalculation of the workout calories of past days with the new formula (kg lifted)
    recalcHistory() {
        const KEY = 'kcal-model-v2:';
        const today = localDate();
        for (const h of this.history) {
            if (!h.energy || h.date >= today) continue;
            try { if (localStorage.getItem(KEY + h.date)) continue; } catch { /* storage unavailable */ }
            recalcPastDay(h.date)
            .then(burned => {
                if (burned !== null) {
                    h.energy.burned = burned;
                    if (h.date === this.date) this.load();
                }
                try { localStorage.setItem(KEY + h.date, '1'); } catch { /* storage unavailable */ }
            })
            .catch(() => {});
        }
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

    proteinOf(meal: string): number {
        return Math.round(this.entriesOf(meal).reduce((sum, e) => sum + (Number(e.protein_g) || 0), 0));
    }

    blankRow() {
        return { name: '', kcal: '' as number | string, protein: '' as number | string };
    }

    openAdd(meal: string) {
        this.adding = meal;
        this.editingId = null;
        this.rows = [this.blankRow()];
    }

    openEdit(e: any) {
        this.adding = e.meal;
        this.editingId = e.id;
        this.rows = [{ name: e.name, kcal: e.kcal, protein: e.protein_g ?? '' }];
    }

    addRow() {
        this.rows.push(this.blankRow());
    }

    removeRow(i: number) {
        this.rows.splice(i, 1);
        if (!this.rows.length) this.rows.push(this.blankRow());
    }

    get filteredRecent(): any[] {
        const q = this.recentQuery.trim().toLowerCase();
        return q ? this.recent.filter(r => String(r.name).toLowerCase().includes(q)) : this.recent;
    }

    // Repeat something eaten before with one tap: fills the empty row or adds a new one
    useRecent(r: any) {
        const filled = { name: r.name, kcal: r.kcal, protein: r.protein_g ?? '' };
        const last = this.rows[this.rows.length - 1];
        if (this.isBlank(last)) this.rows.splice(this.rows.length - 1, 1, filled);
        else this.rows.push(filled);
    }

    isBlank(r: { name: string; kcal: number | string; protein: number | string }): boolean {
        return !r.name.trim() && r.kcal === '' && r.protein === '';
    }

    isValid(r: { name: string; kcal: number | string }): boolean {
        const k = Number(r.kcal);
        return !!r.name.trim() && r.kcal !== '' && Number.isInteger(k) && k >= 0 && k <= 5000;
    }

    // Empty rows are ignored; every other row must be valid
    get canSave(): boolean {
        const used = this.rows.filter(r => !this.isBlank(r));
        return used.length > 0 && used.every(r => this.isValid(r));
    }

    save() {
        if (!this.canSave || this.saving || !this.adding) return;
        this.saving = true;
        const meal = this.adding;
        const items = this.rows.filter(r => !this.isBlank(r)).map(r => ({ meal, name: r.name.trim(), kcal: Number(r.kcal), protein_g: r.protein === '' ? null : Number(r.protein) }));
        const reqs = this.editingId
            ? [http.put(`/nutrition/entries/${this.editingId}`).data(items[0])]
            : items.map(data => http.post('/nutrition/entries').data({ ...data, date: this.date }));
        Promise.all(reqs)
        .then(() => { this.adding = null; this.editingId = null; })
        .catch(() => App.notification(translate.get('nutrition.errors.save')).setType('error').show())
        .finally(() => { this.saving = false; this.refresh(); });
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
