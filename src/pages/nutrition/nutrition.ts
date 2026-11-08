import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import EnergyBar from "@/components/energy-bar/energy-bar.vue";
import FoodForm from "@/components/food-form/food-form.vue";
import localDate from "@/modules/localDate";
import { loadEnergyDay, recalcPastDay } from "@/modules/energyDay";
import userStore from "@/modules/userStore";
import { proteinRange } from "@/modules/calories";
import type { EnergyDay } from "@/modules/energyDay";

const MEALS = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];

// A line of the add form: free text, or a food of the catalog with the amount eaten
interface FoodRow {
    name: string;
    kcal: number | string;
    protein: number | string;
    food?: any;
    amount?: number | string;
}

// Food diary of a day next to what was burned, plus the follow-up of the last days
@Component({ components: { EnergyBar, FoodForm } })
class NutritionPage extends Vue {

    readonly meals = MEALS;
    date = localDate();
    day: EnergyDay | null = null;
    loading = false;
    history: any[] = [];
    weighDue = false;
    weights: any[] = [];

    // Personal catalog of foods (values per 100 g / 100 ml) and its form (create/edit, from a meal or the catalog card)
    // Search in the add form (own and shared foods, looked up on the server) and the paged list of the own ones
    readonly foodPageSize = 10;
    foodResults: any[] = [];
    foodQuery = '';
    foodTimer: any = null;
    myFoods: any[] = [];
    myQuery = '';
    myOffset = 0;
    myTotal = 0;
    myTimer: any = null;
    foodForm: { food: any | null; preset: string; where: 'add' | 'card' } | null = null;

    // Form to add (or edit) food in a meal
    adding: string | null = null;
    editingId: number | null = null;
    rows: FoodRow[] = [{ name: '', kcal: '', protein: '' }];
    saving = false;

    created() {
        this.load();
        this.loadMyFoods();
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

    // Foods that match the text of the add form
    searchFoods() {
        const q = this.foodQuery.trim();
        http.get('/foods').data({ q, pageSize: this.foodPageSize })
        .then((res: any) => { if (q === this.foodQuery.trim()) this.foodResults = res.items ?? []; })
        .catch(() => {});
    }

    onFoodQuery() {
        clearTimeout(this.foodTimer);
        this.foodTimer = setTimeout(() => this.searchFoods(), 250);
    }

    // The user's own foods, a page at a time
    loadMyFoods() {
        http.get('/foods').data({ scope: 'mine', q: this.myQuery.trim(), offset: this.myOffset, pageSize: this.foodPageSize })
        .then((res: any) => {
            // A page can be empty after deleting its last food: go back one
            if (!(res.items ?? []).length && this.myOffset > 0) {
                this.myOffset = Math.max(0, this.myOffset - this.foodPageSize);
                this.loadMyFoods();
                return;
            }
            this.myFoods = res.items ?? [];
            this.myTotal = res.total ?? 0;
        })
        .catch(() => {});
    }

    onMyQuery() {
        clearTimeout(this.myTimer);
        this.myTimer = setTimeout(() => { this.myOffset = 0; this.loadMyFoods(); }, 250);
    }

    get myPage(): number {
        return Math.floor(this.myOffset / this.foodPageSize) + 1;
    }

    get myPages(): number {
        return Math.ceil(this.myTotal / this.foodPageSize) || 1;
    }

    shiftMyPage(n: number) {
        const next = this.myOffset + n * this.foodPageSize;
        if (next < 0 || next >= this.myTotal) return;
        this.myOffset = next;
        this.loadMyFoods();
    }

    beforeUnmount() {
        clearTimeout(this.foodTimer);
        clearTimeout(this.myTimer);
    }

    openFoodForm(food: any | null, preset: string, where: 'add' | 'card') {
        this.foodForm = { food, preset, where };
    }

    // After creating (from the add form) the food is picked right away; after editing only the list changes
    onFoodSaved(food: any, eaten: number | null = null) {
        const form = this.foodForm;
        this.foodForm = null;
        this.loadMyFoods();
        if (form?.where === 'add' && !form.food) {
            this.foodQuery = '';
            this.useFood(food, eaten);
        }
    }

    removeFood(f: any) {
        App.confirm(translate.get('nutrition.foods.confirmDelete', { name: f.name }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/foods/${f.id}`)
            .then(() => { this.loadMyFoods(); this.searchFoods(); })
            .catch(() => App.notification(translate.get('nutrition.errors.foodDelete')).setType('error').show());
        });
    }

    // Weight trend of the last weeks (needs two weighings at least 5 days apart)
    get weightTrend(): { latest: number; date: string; perWeek: number | null } | null {
        const items = this.weights;
        if (!items.length) return null;
        const last = items[items.length - 1];
        const lastMs = new Date(last.date + 'T00:00:00').getTime();
        const from = lastMs - 28 * 86400000;
        const ref = items.find(i => new Date(i.date + 'T00:00:00').getTime() >= from);
        const span = ref ? (lastMs - new Date(ref.date + 'T00:00:00').getTime()) / 86400000 : 0;
        const perWeek = ref && span >= 5 ? ((last.weight_kg - ref.weight_kg) / span) * 7 : null;
        return { latest: last.weight_kg, date: last.date, perWeek };
    }

    // Average deficit (kcal/day) of the logged, finished days of the history; null with fewer than 3 days. Positive = deficit.
    get avgDeficit(): number | null {
        // Today is left out: it is not finished, so its deficit would look bigger than it ends up
        const today = localDate();
        const bal = this.history.filter(h => h.date < today).map(h => this.balance(h)).filter((b): b is number => b !== null);
        return bal.length >= 3 ? -bal.reduce((s, b) => s + b, 0) / bal.length : null;
    }

    // kg a week that the average deficit should change (1 kg of body fat is about 7700 kcal); negative = loss
    get expectedPerWeek(): number | null {
        return this.avgDeficit === null ? null : (-this.avgDeficit * 7) / 7700;
    }

    // How the real trend compares with the one the deficit predicts
    get weightVerdict(): 'match' | 'slower' | 'faster' | null {
        const real = this.weightTrend?.perWeek, exp = this.expectedPerWeek;
        if (real == null || exp === null) return null;
        if (real > exp + 0.25) return 'slower';
        return real < exp - 0.25 ? 'faster' : 'match';
    }

    kgLabel(n: number): string {
        const s = (Math.round(n * 10) / 10).toFixed(1);
        return (n > 0 ? '+' : '') + (translate.currentLanguage === 'en' ? s : s.replace('.', ','));
    }

    // A weight at least once a week keeps the calculation honest
    checkWeight() {
        http.get('/measurements')
        .then((res: any) => {
            this.weights = res.items ?? [];
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
        this.foodQuery = '';
        this.searchFoods();
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

    // Pick a food of the catalog: the row asks for the amount and works out the calories and protein
    useFood(f: any, eaten: number | null = null) {
        const row: FoodRow = { name: f.name, kcal: '', protein: '', food: f, amount: eaten ?? '' };
        const last = this.rows[this.rows.length - 1];
        if (this.isBlank(last)) this.rows.splice(this.rows.length - 1, 1, row);
        else this.rows.push(row);
        // Work out kcal and protein on the reactive row, not on the plain object
        if (eaten) this.onAmount(this.rows[this.rows.indexOf(row)] ?? this.rows[this.rows.length - 1]);
        this.foodQuery = '';
        this.searchFoods();
    }

    // kcal and protein of the amount typed: from the values per 100 g / 100 ml, or per unit
    onAmount(r: FoodRow) {
        const a = Number(r.amount);
        if (!r.food || r.amount === '' || Number.isNaN(a) || a <= 0) {
            r.kcal = '';
            r.protein = '';
            return;
        }
        const factor = r.food.unit === 'u' ? a : a / 100;
        r.kcal = Math.round(r.food.kcal_100 * factor);
        r.protein = r.food.protein_100 ? Math.round(r.food.protein_100 * factor * 10) / 10 : '';
    }

    // The name that is saved: with the amount, so the diary says what was eaten
    rowName(r: FoodRow): string {
        return r.food ? `${r.food.name} (${Number(r.amount)} ${r.food.unit === 'u' ? 'u.' : r.food.unit})` : r.name.trim();
    }

    // What the catalog values of a food are for: "/ 100 g", "/ 100 ml" or "/ unit"
    perLabel(f: any): string {
        return f.unit === 'u' ? translate.get('nutrition.foods.perUnit') : `/ 100 ${f.unit}`;
    }

    isBlank(r: FoodRow): boolean {
        return !r.food && !r.name.trim() && r.kcal === '' && r.protein === '';
    }

    isValid(r: FoodRow): boolean {
        const k = Number(r.kcal);
        const hasAmount = !r.food || Number(r.amount) > 0;
        return !!r.name.trim() && hasAmount && r.kcal !== '' && Number.isInteger(k) && k >= 0 && k <= 5000;
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
        const items = this.rows.filter(r => !this.isBlank(r)).map(r => ({
            meal, name: this.rowName(r), kcal: Number(r.kcal), protein_g: r.protein === '' ? null : Number(r.protein),
            // Catalog food: keep its id and the amount, so the entry stays linked to it (not sent when editing a text entry)
            ...(r.food ? { food_id: r.food.id, amount: Number(r.amount) } : {}),
        }));
        const reqs = this.editingId
            ? [http.put(`/nutrition/entries/${this.editingId}`).data(items[0])]
            : items.map(data => http.post('/nutrition/entries').data({ ...data, date: this.date }));
        Promise.all(reqs)
        .then(() => { this.adding = null; this.editingId = null; })
        .catch(() => App.notification(translate.get('nutrition.errors.save')).setType('error').show())
        .finally(() => { this.saving = false; this.refresh(); });
    }

    // The name is saved with the amount in brackets ("Pollastre cru (160 g)"): split it for the table columns
    entryParts(e: any): { name: string; qty: string } {
        const m = /^(.*?)\s*\(([\d.,]+\s*(?:g|ml|u\.))\)$/.exec(e.name ?? '');
        return m ? { name: m[1], qty: m[2] } : { name: e.name, qty: '—' };
    }

    remove(e: any) {
        App.confirm(translate.get('nutrition.confirmDeleteEntry', { name: this.entryParts(e).name }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/nutrition/entries/${e.id}`)
            .then(() => this.refresh())
            .catch(() => App.notification(translate.get('nutrition.errors.delete')).setType('error').show());
        });
    }

    refresh() {
        this.load();
    }

    historyLabel(date: string): string {
        return new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    }

    // Eaten minus burned of a day; null when what was burned was not saved or nothing was logged
    // (a day without food apuntat is a day not tracked, not a day of fasting, so it is not counted)
    balance(h: any): number | null {
        return h.energy && h.kcal > 0 ? h.kcal - h.energy.burned : null;
    }

    // Did the day end inside the eating goal saved for it? (days with nothing eaten are not judged)
    historyState(h: any): string {
        const e = h.energy;
        if (!e || e.goal_min == null || !h.kcal) return 'none';
        if (h.kcal > e.goal_max) return 'over';
        return h.kcal >= e.goal_min ? 'ok' : 'low';
    }

    // Did the day reach the minimum protein? null for days without food apuntat (not judged) or without a goal
    proteinOk(h: any): boolean | null {
        const g = this.proteinGoal;
        if (!g || !h.kcal) return null;
        return (h.protein_g ?? 0) >= g.min;
    }

    // Protein of the finished, logged days of the history (today is left out: it can still grow)
    get proteinSummary(): { reached: number; days: number; avg: number } | null {
        const today = localDate();
        const g = this.proteinGoal;
        if (!g) return null;
        const days = this.history.filter(h => h.date < today && h.kcal > 0);
        if (days.length < 3) return null;
        const reached = days.filter(h => (h.protein_g ?? 0) >= g.min).length;
        const avg = Math.round(days.reduce((s, h) => s + (h.protein_g ?? 0), 0) / days.length);
        return { reached, days: days.length, avg };
    }

    balanceLabel(h: any): string {
        const b = this.balance(h);
        return b === null ? '' : (b > 0 ? '+' : '') + b;
    }
}
export default toNative(NutritionPage);
