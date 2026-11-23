import { Component, Vue, Watch, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import EnergyBar from "@/components/energy-bar/energy-bar.vue";
import WaterCard from "@/components/water-card/water-card.vue";
import localDate from "@/modules/localDate";
import { loadEnergyDay, recalcPastDay } from "@/modules/energyDay";
import userStore from "@/modules/userStore";
import SwipeRow from "@/components/swipe-row/swipe-row.vue";
import { proteinRange } from "@/modules/calories";
import { macroTargets } from "@/modules/macros";
import type { EnergyDay } from "@/modules/energyDay";
import { celebrate } from "@/modules/confetti";

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
@Component({ components: { EnergyBar, WaterCard, SwipeRow } })
class NutritionPage extends Vue {

    readonly meals = MEALS;
    // An icon for each meal (the icons are SVG, not characters)
    readonly mealIcons: Record<string, string> = {
        breakfast: 'awesome-solid/mug-saucer', lunch: 'awesome-solid/utensils', snack: 'awesome-solid/apple-whole',
        dinner: 'awesome-solid/moon', other: 'awesome-solid/bowl-food',
    };
    date = localDate();
    day: EnergyDay | null = null;
    loading = false;
    history: any[] = [];
    weighDue = false;
    weights: any[] = [];

    // Form to add (or edit) food in a meal
    adding: string | null = null;
    // The meal whose rows show the edit and delete buttons, and the info modal that is open
    infoModal: 'energy' | null = null;
    // Today as a date, to jump back to it from another day
    get localToday(): string { return localDate(); }
    editingId: number | null = null;
    rows: FoodRow[] = [{ name: '', kcal: '', protein: '' }];
    // "Save as a meal": the meal whose name is being typed
    // The menu of a meal (the three dots) and the dialog to copy it from / to another day
    menuMeal: string | null = null;
    copyDlg: { meal: string; mode: 'from' | 'to'; date: string } | null = null;
    saveMealFor: string | null = null;
    saveMealName = '';
    saveMealBusy = false;
    saving = false;
    copying = false;

    created() {
        // Coming from the calendar of Progrés: /nutrition?date=Y-m-d opens that day
        const wanted = String(this.$route?.query?.date ?? '');
        if (/^\d{4}-\d{2}-\d{2}$/.test(wanted) && wanted <= localDate()) this.date = wanted;
        this.load();
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

    // Carbohydrates, fiber, saturated fat and sodium of the day, added from the entries that know them.
    // `missing` is how many entries have no figure (no catalog food, or a food without that value): the total is then a minimum
    get dayExtras(): { carbs: number; fat: number; fiber: number; saturates: number; sodium: number; missing: number } {
        const entries: any[] = this.day?.entries ?? [];

        const sum = (key: string) => Math.round(entries.reduce((s, e) => s + (Number(e[key]) || 0), 0) * 10) / 10;
        const known = (e: any) => e.carbs_g != null && e.fat_g != null && e.sodium_mg != null;

        return {
            carbs: Math.round(sum('carbs_g')), fat: Math.round(sum('fat_g')), fiber: sum('fiber_g'), saturates: sum('saturates_g'), sodium: Math.round(sum('sodium_mg')),
            missing: entries.filter((e: any) => !known(e)).length,
        };
    }

    // Bars of the other nutrients against their targets (the protein has its own bar). Goals fill up; ceilings
    // (saturated fat, sodium) turn red when passed. null while the profile lacks the data for the targets
    get macroBars(): { key: string; value: number; target: number; unit: string; ceiling: boolean; pct: number; over: boolean; noData: boolean; range?: string }[] | null {
        const x = this.dayExtras;
        const t = this.day?.ready ? macroTargets(userStore.data, this.day.goal, this.day.min, this.day.max) : null;
        if (!(this.day?.entries ?? []).length || !t) return null;

        // No entry of the day has a figure for it: that is "no data", not a real 0
        const entries: any[] = this.day?.entries ?? [];
        const field: Record<string, string> = { carbs: 'carbs_g', fat: 'fat_g', fiber: 'fiber_g', saturates: 'saturates_g', sodium: 'sodium_mg' };
        const bar = (key: string, value: number, target: number, unit: string, ceiling: boolean, range?: string) => ({
            key, value, target, unit, ceiling, range,
            noData: !entries.some((e: any) => e[field[key]] != null),
            pct: Math.min(100, Math.round((value / target) * 100)),
            over: ceiling ? value > target : value > target * 1.15,
        });

        return [
            bar('carbs', x.carbs, t.carbs, 'g', false),
            bar('fat', x.fat, t.fat.max, 'g', false, `${t.fat.min} - ${t.fat.max}`),
            bar('fiber', x.fiber, t.fiber, 'g', false),
            bar('saturates', x.saturates, t.saturatesMax, 'g', true),
            bar('sodium', x.sodium, t.sodiumMax, 'mg', true),
        ];
    }

    // 7 days without vegetables or fruit: the last 7 days have food logged on at least 3 of them and none has a
    // vegetable or fruit. Days without anything logged do not count; an old API without the `plant` flag never alerts
    get noPlantsAlert(): boolean {
        const from = new Date(localDate() + 'T00:00:00');
        from.setDate(from.getDate() - 6);
        const start = localDate(from);

        const logged = this.history.filter((h: any) => h.date >= start && h.kcal > 0);
        if (logged.length < 3 || logged.some((h: any) => h.plant === undefined)) return false;
        return logged.every((h: any) => !h.plant);
    }

    // ---- Redesign: calories bar, macro columns, week strip ----

    get kcalState(): 'low' | 'ok' | 'over' {
        const d = this.day;
        if (!d) return 'low';
        if (d.eaten > d.max) return 'over';
        return d.eaten >= d.min ? 'ok' : 'low';
    }

    get kcalPct(): number {
        const d = this.day;
        return d && d.max > 0 ? Math.min(100, Math.round((d.eaten / d.max) * 100)) : 0;
    }

    get kcalMinPct(): number {
        const d = this.day;
        return d && d.max > 0 ? Math.round((d.min / d.max) * 100) : 0;
    }

    mealIcon(meal: string): string {
        return this.mealIcons[meal] ?? this.mealIcons.other;
    }

    // The days of the week of the selected day (Monday first), with the ones that have food logged
    get weekDays(): { date: string; letter: string; logged: boolean; selected: boolean; future: boolean }[] {
        const sel = new Date(this.date + 'T00:00:00');
        const monday = new Date(sel);
        monday.setDate(sel.getDate() - ((sel.getDay() + 6) % 7));
        const today = localDate();
        const logged = new Set(this.history.filter((h: any) => h.kcal > 0).map((h: any) => h.date));

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const date = localDate(d);
            return { date, letter: d.toLocaleDateString(undefined, { weekday: 'narrow' }).toUpperCase(), logged: logged.has(date), selected: date === this.date, future: date > today };
        });
    }

    selectDay(date: string) {
        if (date > localDate() || date === this.date) return;
        this.date = date;
        this.adding = null;
        this.load();
    }

    get proteinPct(): number {
        const g = this.proteinGoal;
        return g && this.day ? Math.min(100, Math.round((this.day.protein / g.max) * 100)) : 0;
    }

    get isToday(): boolean {
        return this.date === localDate();
    }

    // Reaching the minimum protein of the day while on the screen is celebrated (once a day)
    @Watch('day')
    onDayChange(now: EnergyDay | null, before: EnergyDay | null) {
        const min = this.proteinGoal?.min;
        if (!now || !before || !min || now.date !== before.date || now.date !== localDate()) return;
        if (before.protein >= min || now.protein < min) return;
        const key = `wg_cel_protein_${now.date}`;
        try {
            if (window.localStorage.getItem(key)) return;
            window.localStorage.setItem(key, '1');
        } catch { /* it just may repeat */ }
        celebrate();
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

    // Adding food to a meal is its own screen
    openAdd(meal: string) {
        this.$router.push({ path: '/nutrition/add', query: { meal, date: this.date } });
    }

    openEdit(e: any) {
        this.adding = e.meal;
        this.editingId = e.id;
        const qty = this.entryParts(e);
        const amount = Number(e.amount);
        if (e.food_id && amount > 0 && qty.qty !== '—') {
            // Linked to a catalog food: the amount can be edited and kcal/protein follow it.
            // The values per 100 g/ml (or per unit) are worked out from what the entry has now.
            const unit = /ml$/.test(qty.qty) ? 'ml' : /u\.$/.test(qty.qty) ? 'u' : 'g';
            const k = unit === 'u' ? 1 : 100;
            const food = { id: e.food_id, name: qty.name, unit, kcal_100: e.kcal * k / amount, protein_100: e.protein_g ? e.protein_g * k / amount : 0 };
            this.rows = [{ name: e.name, kcal: e.kcal, protein: e.protein_g ?? '', food, amount }];
        } else {
            this.rows = [{ name: e.name, kcal: e.kcal, protein: e.protein_g ?? '' }];
        }
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

    // Why the save button is disabled: the first row that is not complete
    get saveHint(): string {
        if (this.canSave || this.editingId) return '';
        const bad = this.rows.filter(r => !this.isBlank(r)).find(r => !this.isValid(r));
        if (!bad) return '';
        const name = bad.food ? bad.food.name : bad.name.trim();
        const amount = Number(bad.amount);
        if (bad.food && (Number.isNaN(amount) || amount <= 0)) return translate.get('nutrition.hintAmount', { name });
        if (!name) return translate.get('nutrition.hintName');
        return translate.get('nutrition.hintKcal', { name });
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

    // The entries of a meal added to a meal of a day (the catalog link and amount go with them)
    copyEntries(entries: any[], meal: string, date: string) {
        return Promise.all(entries.map((e: any) => http.post('/nutrition/entries').data({
            date, meal, name: e.name, kcal: e.kcal, protein_g: e.protein_g,
            ...(e.food_id ? { food_id: e.food_id, amount: e.amount } : {}),
        })));
    }

    // Same breakfast as the day before: copy what the previous day has in this meal
    copyPrevious(meal: string) {
        if (this.copying) return;
        const d = new Date(this.date + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        this.copying = true;
        http.get('/nutrition/day').data({ date: localDate(d) })
        .then((res: any) => {
            const prev = (res.entries ?? []).filter((e: any) => e.meal === meal);
            if (!prev.length) {
                App.notification(translate.get('nutrition.copyPrevEmpty')).show();
                return null;
            }
            return this.copyEntries(prev, meal, this.date);
        })
        .catch(() => App.notification(translate.get('nutrition.errors.copy')).setType('error').show())
        .finally(() => { this.copying = false; this.refresh(); });
    }

    // The three dots open the menu of the meal
    onMealMenu(meal: string) {
        this.menuMeal = this.menuMeal === meal ? null : meal;
    }

    menuSave(meal: string) {
        this.menuMeal = null;
        this.openSaveMeal(meal);
    }

    // The day to copy from starts as the day before, the day to copy to as today
    openCopy(meal: string, mode: 'from' | 'to') {
        this.menuMeal = null;
        const d = new Date(this.date + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        this.copyDlg = { meal, mode, date: mode === 'from' ? localDate(d) : localDate() };
    }

    confirmCopy() {
        const dlg = this.copyDlg;
        if (!dlg || this.copying || !dlg.date || dlg.date > localDate() || dlg.date === this.date) return;
        this.copying = true;
        const done = dlg.mode === 'from'
            // From another day: what that day has in this meal comes to the day on screen
            ? http.get('/nutrition/day').data({ date: dlg.date }).then((res: any) => {
                const src = (res.entries ?? []).filter((e: any) => e.meal === dlg.meal);
                if (!src.length) return 'empty';
                return this.copyEntries(src, dlg.meal, this.date).then(() => 'ok');
            })
            // To another day: what the meal has on screen goes to that day
            : (() => {
                const src = this.entriesOf(dlg.meal);
                return src.length ? this.copyEntries(src, dlg.meal, dlg.date).then(() => 'ok') : Promise.resolve('empty');
            })();

        done.then((r: any) => {
            this.copyDlg = null;
            App.notification(translate.get(r === 'ok' ? 'nutrition.menu.copied' : `nutrition.menu.empty${dlg.mode === 'from' ? 'From' : 'To'}`)).show();
        })
        .catch(() => App.notification(translate.get('nutrition.errors.copy')).setType('error').show())
        .finally(() => { this.copying = false; this.refresh(); });
    }

    refresh() {
        this.load();
    }

    openSaveMeal(meal: string) {
        this.saveMealFor = meal;
        this.saveMealName = '';
    }

    // The foods of a meal of the day become a saved meal ("mis comidas") to add again with one tap
    saveAsMeal(meal: string) {
        const name = this.saveMealName.trim();
        const entries = this.entriesOf(meal);
        if (!name || !entries.length || this.saveMealBusy) return;
        this.saveMealBusy = true;
        http.post('/meal-templates').data({
            name, kind: 'meal', servings: 1,
            items: entries.map((e: any) => ({ food_id: e.food_id ?? null, name: e.name, amount: e.amount ?? null, kcal: e.kcal, protein_g: e.protein_g ?? null })),
        })
        .then(() => {
            this.saveMealFor = null;
            App.notification(translate.get('foodAdd.saveMeal.done')).show();
        })
        .catch((e: any) => {
            const key = e?.data?.error === 'name.taken' ? 'taken' : 'error';
            App.notification(translate.get(`foodAdd.saveMeal.${key}`)).setType('error').show();
        })
        .finally(() => { this.saveMealBusy = false; });
    }

    historyLabel(date: string): string {
        return new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    }

    // Eaten minus burned of a day; null when what was burned was not saved or nothing was logged
    // (a day without food apuntat is a day not tracked, not a day of fasting, so it is not counted)
    balance(h: any): number | null {
        return h.energy && h.kcal > 0 ? h.kcal - h.energy.burned : null;
    }

}
export default toNative(NutritionPage);
