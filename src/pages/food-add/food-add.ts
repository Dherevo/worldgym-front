import { Component, Vue, Watch, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import FoodForm from "@/components/food-form/food-form.vue";
import localDate from "@/modules/localDate";
import { isApp } from "@/modules/platform";
import userStore from "@/modules/userStore";
import { scanBarcode } from "@/modules/barcode";
import { loadEnergyDay } from "@/modules/energyDay";
import { proteinRange } from "@/modules/calories";
import { macroTargets } from "@/modules/macros";
import { loadFoodCategories, categoryName, topCategories, childrenOf } from "@/modules/foodCategories";
import type { FoodCategory } from "@/modules/foodCategories";

const MEALS = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];
const PAGE = 20;

// A food added to a meal or recipe being built: kcal and protein are for the amount
interface BuilderItem {
    food_id: number | null;
    name: string;
    amount: number | null;
    kcal: number;
    protein_g: number | null;
}

interface Builder {
    id: number | null;
    name: string;
    kind: 'meal' | 'recipe';
    servings: number | string;
    items: BuilderItem[];
}

// Screen to add food to a meal of a day: the foods by tab (mine, all, my meals, my recipes, categories),
// the barcode scanner and the form of a new food. Every food asks for its amount before it goes to the diary.
import BackButton from "@/components/back-button/back-button.vue";
import SearchInput from "@/components/search-input/search-input.vue";
import SwipeRow from "@/components/swipe-row/swipe-row.vue";
@Component({ components: { FoodForm, BackButton, SearchInput, SwipeRow } })
class FoodAddPage extends Vue {

    readonly meals = MEALS;
    readonly isApp = isApp;

    meal = 'breakfast';
    date = localDate();

    categories: FoodCategory[] = [];
    tab = 'all';
    sub: number | null = null;

    query = '';
    timer: any = null;
    foods: any[] = [];
    total = 0;
    offset = 0;
    loading = false;
    // Names of what was eaten lately (without the amount), to suggest those foods first
    recents: string[] = [];
    // What was added in this visit: it shows a check
    addedFoods: number[] = [];
    addedTemplates: number[] = [];
    request = 0;

    // Open Food Facts search by name or barcode
    offResults: any[] = [];
    offSearching = false;
    offToken = 0;
    offFailed = false;
    // Code of the Open Food Facts product that is being saved (shows a spinner on its row)
    offPicking = '';
    // Filters of the Open Food Facts search (the panel opens with the funnel button)
    showFilters = false;
    filters = { category: '', brand: '', protein_min: '', kcal_max: '', carbs_max: '', fat_max: '' };
    endObserver: IntersectionObserver | null = null;
    offSearched = false;
    offSaving = false;
    scanning = false;

    foodForm: { food: any | null; preset: string; code: string } | null = null;

    // Targets of the day and what is already eaten, for the percentages of the amount sheet (null: the profile is incomplete)
    goals: { kcal: { goal: number; eaten: number }; carbs: { goal: number; eaten: number }; fat: { goal: number; eaten: number }; protein: { goal: number; eaten: number } } | null = null;
    goalsLoaded = false;

    // Amount sheet of a food
    sheet: { food: any; amount: number | string } | null = null;
    saving = false;

    // Meals and recipes
    templates: any[] = [];
    tplSheet: { t: any; servings: number | string } | null = null;
    builder: Builder | null = null;
    bQuery = '';
    bResults: any[] = [];
    bTimer: any = null;
    bPick: { food: any; amount: number | string } | null = null;

    created() {
        const q: any = this.$route.query;
        if (MEALS.includes(q.meal)) this.meal = q.meal;
        if (/^\d{4}-\d{2}-\d{2}$/.test(q.date ?? '') && q.date <= localDate()) this.date = q.date;

        loadFoodCategories().then(list => { this.categories = list; });
        http.get('/nutrition/recent')
        .then((res: any) => { this.recents = (res.items ?? []).map((i: any) => this.plainName(i.name)); })
        .catch(() => {});
        this.reload();
    }

    beforeUnmount() {
        clearTimeout(this.timer);
        clearTimeout(this.bTimer);
        this.endObserver?.disconnect();
    }

    // ---- Tabs ----

    get topCats(): FoodCategory[] {
        return topCategories(this.categories);
    }

    get catId(): number | null {
        return this.tab.startsWith('cat:') ? Number(this.tab.slice(4)) : null;
    }

    get subCats(): FoodCategory[] {
        return this.catId === null ? [] : childrenOf(this.categories, this.catId);
    }

    get isTemplateTab(): boolean {
        return this.tab === 'meals' || this.tab === 'recipes';
    }

    catName(c: FoodCategory): string {
        return categoryName(c);
    }

    selectTab(tab: string) {
        if (tab === this.tab) return;
        this.tab = tab;
        this.sub = null;
        this.reload();
    }

    selectSub(id: number | null) {
        this.sub = id;
        this.reload();
    }

    onQuery() {
        this.offToken += 1;
        this.offSearching = false;
        this.offResults = [];
        this.offSearched = false;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.reload(), 250);
    }

    reload() {
        if (this.blankOwn && !this.isTemplateTab) { this.foods = []; this.total = 0; this.$nextTick(() => this.watchEnd()); return; }
        if (this.isTemplateTab) this.loadTemplates();
        else this.loadFoods(true);
    }

    back() {
        if (window.history.state?.back) this.$router.back();
        else this.to('/nutrition');
    }

    get dateLabel(): string {
        return this.date === localDate() ? '' : new Date(this.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    }

    // ---- Foods ----

    loadFoods(reset: boolean) {
        this.request += 1;
        const id = this.request;
        if (reset) this.offset = 0;
        this.loading = true;

        const data: any = { scope: this.tab === 'mine' ? 'mine' : 'all', pageSize: PAGE, offset: reset ? 0 : this.offset };
        if (this.query.trim()) data.q = this.query.trim();
        if (this.catId !== null) data.category = this.sub ?? this.catId;
        else if (this.tab === 'all' && this.filters.category) data.category = this.filters.category;

        http.get('/foods').data(data)
        .then((res: any) => {
            if (id !== this.request) return;
            const items = res.items ?? [];
            this.foods = reset ? items : [...this.foods, ...items];
            this.total = res.total ?? 0;
            this.offset = this.foods.length;
            this.$nextTick(() => this.watchEnd());
        })
        .catch(() => { if (id === this.request) App.notification(translate.get('foodAdd.errors.load')).setType('error').show(); })
        .finally(() => { if (id === this.request) this.loading = false; });
    }

    // The products of Open Food Facts that are not already in the list above (the same barcode)
    get offShown(): any[] {
        const codes = new Set(this.foods.map(f => f.off_code).filter(Boolean));
        return this.offResults.filter(p => !codes.has(p.code));
    }

    // On "all foods" Open Food Facts is searched when the user reaches the end of the own results
    get offWanted(): boolean {
        return this.tab === 'all' && (this.query.trim().length >= 2 || this.filtersActive) && !this.loading;
    }

    // The end marker appears when the own results are on screen: from then on it waits for the user to get there
    @Watch('offWanted')
    onOffWanted() {
        this.$nextTick(() => this.watchEnd());
    }

    // The filters that have a value, as they go to the API
    get activeFilters(): Record<string, string> {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(this.filters)) if (String(v).trim() !== '') out[k] = String(v).trim();
        return out;
    }

    // With brand or nutrient limits and nothing typed, the own foods are not listed (it would be the whole catalog)
    get blankOwn(): boolean {
        return this.tab === 'all' && this.filtersActive && !this.query.trim() && !this.filters.category;
    }

    // The categories for the filter: each main one followed by its subcategories
    get filterCats(): { id: number; label: string }[] {
        return this.topCats.flatMap(t => [{ id: t.id, label: this.catName(t) }, ...childrenOf(this.categories, t.id).map(c => ({ id: c.id, label: '\u00A0\u00A0\u21B3 ' + this.catName(c) }))]);
    }

    get filtersActive(): boolean {
        return Object.keys(this.activeFilters).length > 0;
    }

    applyFilters() {
        this.offResults = [];
        this.offSearched = false;
        this.offToken += 1;
        this.offSearching = false;
        // With filters and no text the own foods are not listed (it would be the whole catalog)
        if (this.blankOwn) { this.foods = []; this.total = 0; this.searchOff(true); }
        else this.reload();
    }

    clearFilters() {
        this.filters = { category: '', brand: '', protein_min: '', kcal_max: '', carbs_max: '', fat_max: '' };
        this.applyFilters();
    }

    watchEnd() {
        this.endObserver?.disconnect();
        this.endObserver = null;
        const el = this.$refs.offEnd as HTMLElement | undefined;
        if (!el || !this.offWanted || this.offSearched || this.offSearching) return;
        this.endObserver = new IntersectionObserver(entries => {
            if (!entries.some(e => e.isIntersecting)) return;
            this.endObserver?.disconnect();
            this.endObserver = null;
            this.searchOff(true);
        }, { rootMargin: '120px' });
        this.endObserver.observe(el);
    }

    // A food of the shared catalog or the user's own, from a natural category and without brand (eggs, vegetables, pulses...)
    get naturalIds(): Set<number> {
        const slugs = ['fruita', 'verdura', 'ous', 'llegums', 'fruits-secs', 'peix', 'peix-blanc', 'peix-blau', 'peix-marisc', 'carn-pollastre', 'carn-vedella', 'carn-porc'];
        return new Set(this.categories.filter(c => slugs.includes(c.slug)).map(c => c.id));
    }

    isNatural(f: any): boolean {
        if (f.brand || f.off_code) return false;
        return (f.category_ids ?? []).some((id: number) => this.naturalIds.has(id));
    }

    get hasMore(): boolean {
        return this.foods.length < this.total;
    }

    // The name of an entry without its amount: "Pa (60 g)" -> "pa"
    plainName(name: string): string {
        return String(name ?? '').replace(/\s*\([\d.,]+\s*(?:g|ml|u\.)\)$/, '').trim().toLowerCase();
    }

    // Foods eaten lately come first when nothing is typed (only on the lists of foods that are not a category)
    get showSuggestions(): boolean {
        return !this.query.trim() && this.catId === null && !this.isTemplateTab;
    }

    get suggested(): any[] {
        return this.showSuggestions ? this.foods.filter(f => this.recents.includes(this.plainName(f.name))) : [];
    }

    get listed(): any[] {
        return this.showSuggestions ? this.foods.filter(f => !this.recents.includes(this.plainName(f.name))) : this.foods;
    }

    perLabel(f: any): string {
        return f.unit === 'u' ? translate.get('foodAdd.perUnit') : translate.get('foodAdd.per100', { unit: f.unit });
    }

    // ---- Open Food Facts and barcode ----

    // Returns 'found', 'none' (OFF answered but has nothing) or 'error' (OFF not available)
    searchOff(silent = false): Promise<'found' | 'none' | 'error'> {
        const q = this.query.trim();
        if (q.length < 2 && !this.filtersActive) return Promise.resolve('error');
        this.offToken += 1;
        const token = this.offToken;
        this.offSearching = true;
        this.offSearched = false;
        this.offFailed = false;

        const isCode = /^\d{6,14}$/.test(q);
        const req = isCode ? http.get(`/foods/off/${q}`) : http.get('/foods/off').data({ q, ...this.activeFilters });
        return req.then((res: any) => {
            if (token !== this.offToken) return 'none';
            this.offResults = isCode ? [res] : (res.items ?? []);
            return this.offResults.length ? 'found' : 'none';
        })
        .catch((e: any) => {
            if (token !== this.offToken) return 'none';
            this.offResults = [];
            if (isCode && e?.data?.error !== 'off.unavailable') return 'none';
            this.offFailed = true;
            if (silent) return 'error';
            App.notification(translate.get('nutrition.off.unavailable')).setType('error').show();
            return 'error';
        })
        .finally(() => { if (token === this.offToken) { this.offSearching = false; this.offSearched = true; } }) as Promise<'found' | 'none' | 'error'>;
    }

    // The product goes to the catalog (shared with every user, with its barcode and nutrients) and its amount sheet opens
    pickOff(p: any) {
        if (this.offSaving) return;
        this.offSaving = true;
        this.offPicking = p.code;

        const ok = (v: any, max: number) => (typeof v === 'number' && v >= 0 && v <= max ? v : null);
        const category = this.categories.find(c => c.slug === p.category);
        const save = (name: string) => http.post('/foods').data({
            name, unit: p.unit, kcal_100: p.kcal_100, protein_100: ok(p.protein_100, 100) ?? 0,
            fiber_100: ok(p.fiber_100, 100), saturates_100: ok(p.saturates_100, 100), carbs_100: ok(p.carbs_100, 100),
            fat_100: ok(p.fat_100, 100), sodium_100: ok(p.sodium_100, 40000), brand: p.brand ?? '', off_code: p.code,
            ...(category ? { category_ids: [category.id] } : {}),
        });

        const taken = (e: any) => e?.data?.error === 'name.taken';
        save(p.name)
        .catch((e: any) => {
            if (!taken(e)) throw e;
            return p.brand ? save(`${p.name} ${p.brand}`.slice(0, 150)) : Promise.reject(e);
        })
        .catch((e: any) => {
            if (!taken(e)) throw e;
            return save(`${p.name} ${p.code}`.slice(0, 150));
        })
        .then((food: any) => {
            this.offResults = [];
            this.offSearched = false;
            this.reload();
            this.openSheet(food);
        })
        .catch((e: any) => {
            const code = e?.data?.error;
            App.notification(translate.get('nutrition.off.saveError') + (code ? ` (${code})` : '')).setType('error').show();
        })
        .finally(() => { this.offSaving = false; this.offPicking = ''; });
    }

    // Scans a barcode: the food of the catalog with it opens straight away; if there is none, Open Food Facts is
    // searched, and if it has nothing either, the new food form opens with the code
    async scanFood() {
        if (this.scanning) return;
        this.scanning = true;
        try {
            const res = await scanBarcode();
            if (res.status === 'installing') {
                App.notification(translate.get('nutrition.scan.installing')).show();
                return;
            }
            if (res.status === 'error') {
                App.notification(translate.get('nutrition.scan.error')).setType('error').show();
                return;
            }
            if (res.status !== 'ok') return;

            this.query = res.code;
            this.offResults = [];
            this.offSearched = false;
            const list: any = await http.get('/foods').data({ q: res.code, pageSize: PAGE, scope: 'all' });
            const found: any[] = list.items ?? [];
            this.foods = found;
            this.total = list.total ?? found.length;

            const own = found.find((f: any) => f.off_code === res.code);
            if (own) this.openSheet(own);
            else if (!found.length) {
                const result = await this.searchOff();
                if (result === 'none') {
                    App.notification(translate.get('nutrition.scan.notFound')).show();
                    this.query = '';
                    this.foodForm = { food: null, preset: '', code: res.code };
                }
            }
        } catch {
            App.notification(translate.get('nutrition.scan.error')).setType('error').show();
        } finally {
            this.scanning = false;
        }
    }

    openFoodForm() {
        this.foodForm = { food: null, preset: this.query.trim(), code: '' };
    }

    // A food of the user: edit it in the same sheet, or remove it from the catalog (entries already in the diary keep their figures)
    editFood(f: any) {
        this.foodForm = { food: f, preset: '', code: '' };
    }

    // Only administrators can share a food with every user (the API refuses anyone else)
    get isAdmin(): boolean {
        return userStore.data?.isAdmin === true;
    }

    shareFood(f: any) {
        App.confirm(translate.get('foodAdd.share.confirm', { name: f.name }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.put(`/foods/${f.id}/share`)
            .then(() => { App.notification(translate.get('foodAdd.share.done')).show(); this.reload(); })
            .catch(() => App.notification(translate.get('foodAdd.share.error')).setType('error').show());
        });
    }

    removeFood(f: any) {
        App.confirm(translate.get('nutrition.foods.confirmDelete', { name: f.name }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/foods/${f.id}`)
            .then(() => this.reload())
            .catch(() => App.notification(translate.get('nutrition.errors.foodDelete')).setType('error').show());
        });
    }

    onFoodSaved(food: any, eaten: number | null = null) {
        // Editing only changes the list; a new food goes straight to the amount sheet
        if (this.foodForm?.food) {
            this.foodForm = null;
            this.reload();
            return;
        }
        this.foodForm = null;
        this.query = '';
        this.reload();
        this.openSheet(food, eaten ?? undefined);
    }

    // ---- Amount sheet ----

    unitLabel(f: any): string {
        return f.unit === 'u' ? translate.get('foodAdd.sheet.unitOne') : f.unit;
    }

    openSheet(food: any, amount?: number) {
        this.sheet = { food, amount: amount ?? (food.unit === 'u' ? 1 : 100) };
        this.ensureGoals();
    }

    // The same targets as the Food screen: the calories up to the top of the range, the protein up to its maximum
    ensureGoals() {
        if (this.goalsLoaded) return;
        this.goalsLoaded = true;
        loadEnergyDay(this.date)
        .then(day => {
            const t = day.ready ? macroTargets(userStore.data, day.goal, day.min, day.max) : null;
            const p = day.ready ? proteinRange(userStore.data, day.goal) : null;
            if (!t || !p) {
                this.goals = null;
                return;
            }
            const sum = (key: string) => Math.round(day.entries.reduce((s: number, e: any) => s + (Number(e[key]) || 0), 0) * 10) / 10;
            this.goals = {
                kcal: { goal: day.max, eaten: day.eaten },
                carbs: { goal: t.carbs, eaten: sum('carbs_g') },
                fat: { goal: t.fat.max, eaten: sum('fat_g') },
                protein: { goal: p.max, eaten: day.protein },
            };
        })
        .catch(() => { this.goalsLoaded = false; });
    }

    // Share of the calories of the food that comes from each macro (4 / 9 / 4 kcal per gram)
    get macroSplit(): { key: string; grams: number | null; pct: number }[] {
        const m = this.sheetMacros;
        const parts = [
            { key: 'carbs', grams: m.carbs, kcal: (m.carbs ?? 0) * 4 },
            { key: 'fat', grams: m.fat, kcal: (m.fat ?? 0) * 9 },
            { key: 'protein', grams: m.protein, kcal: m.protein * 4 },
        ];
        const total = parts.reduce((s, p) => s + p.kcal, 0);
        return parts.map(p => ({ key: p.key, grams: p.grams, pct: total > 0 ? Math.round((p.kcal / total) * 100) : 0 }));
    }

    // The ring around the calories: one arc per macro, in the order of the split
    get ringSegs(): { key: string; dash: string; offset: number }[] {
        const C = 2 * Math.PI * 26;
        const split = this.macroSplit;
        const total = split.reduce((s, p) => s + p.pct, 0);
        if (total <= 0) return [];
        let start = 0;
        return split.filter(p => p.pct > 0).map(p => {
            const len = (p.pct / total) * C;
            const seg = { key: p.key, dash: `${len} ${C - len}`, offset: -start };
            start += len;
            return seg;
        });
    }

    // Bars against the daily targets: what was eaten (solid) and what this food adds (soft)
    get goalBars(): { key: string; value: number; goal: number; unit: string; pctEaten: number; pctAdd: number; total: number; over: boolean }[] {
        const g = this.goals;
        if (!g || this.factor <= 0) return [];
        const m = this.sheetMacros;
        const rows: [string, { goal: number; eaten: number }, number, string][] = [
            ['kcal', g.kcal, m.kcal, 'kcal'], ['carbs', g.carbs, m.carbs ?? 0, 'g'], ['fat', g.fat, m.fat ?? 0, 'g'], ['protein', g.protein, m.protein, 'g'],
        ];
        return rows.filter(([, x]) => x.goal > 0).map(([key, x, add, unit]) => {
            const value = Math.round((x.eaten + add) * 10) / 10;
            const pctEaten = Math.min(100, (x.eaten / x.goal) * 100);
            return {
                key, value, goal: Math.round(x.goal), unit, pctEaten, pctAdd: Math.max(0, Math.min(100 - pctEaten, (add / x.goal) * 100)),
                total: Math.round((value / x.goal) * 100), over: value > x.goal,
            };
        });
    }

    get factor(): number {
        const s = this.sheet;
        const a = Number(s?.amount);
        if (!s || Number.isNaN(a) || a <= 0) return 0;
        return s.food.unit === 'u' ? a : a / 100;
    }

    // kcal and macros of the amount typed; null when the food does not know that value
    get sheetMacros(): { kcal: number; protein: number; carbs: number | null; fat: number | null } {
        const f = this.sheet?.food;
        const k = this.factor;
        const r = (v: any, d = 1) => (v == null ? null : Math.round(Number(v) * k * 10 ** d) / 10 ** d);
        return {
            kcal: Math.round((f?.kcal_100 ?? 0) * k), protein: r(f?.protein_100) ?? 0,
            carbs: r(f?.carbs_100), fat: r(f?.fat_100),
        };
    }

    confirmSheet() {
        const s = this.sheet;
        if (!s || this.saving || this.factor <= 0) return;
        this.saving = true;
        const amount = Number(s.amount);
        const m = this.sheetMacros;
        http.post('/nutrition/entries').data({
            meal: this.meal, date: this.date,
            name: `${String(s.food.name).slice(0, 120)} (${amount} ${this.unitLabel(s.food)})`,
            kcal: m.kcal, protein_g: m.protein || null, food_id: s.food.id, amount,
        })
        .then(() => {
            if (!this.addedFoods.includes(s.food.id)) this.addedFoods.push(s.food.id);
            // What was just added counts as eaten for the next percentages
            this.goalsLoaded = false;
            App.notification(translate.get('foodAdd.addedTo', { name: s.food.name, meal: translate.get('nutrition.meals.' + this.meal).toLowerCase() })).show();
            this.sheet = null;
        })
        .catch(() => App.notification(translate.get('foodAdd.errors.add')).setType('error').show())
        .finally(() => { this.saving = false; });
    }

    // ---- My meals and recipes ----

    loadTemplates() {
        this.request += 1;
        const id = this.request;
        this.loading = true;
        const data: any = { kind: this.tab === 'meals' ? 'meal' : 'recipe' };
        if (this.query.trim()) data.q = this.query.trim();

        http.get('/meal-templates').data(data)
        .then((res: any) => { if (id === this.request) this.templates = res.items ?? []; })
        .catch(() => { if (id === this.request) App.notification(translate.get('foodAdd.errors.tplLoad')).setType('error').show(); })
        .finally(() => { if (id === this.request) this.loading = false; });
    }

    openTplSheet(t: any) {
        this.tplSheet = { t, servings: 1 };
    }

    confirmTpl() {
        const s = this.tplSheet;
        const n = Number(s?.servings);
        if (!s || this.saving || Number.isNaN(n) || n < 0.1 || n > 100) return;
        this.saving = true;
        http.post(`/meal-templates/${s.t.id}/log`).data({ meal: this.meal, date: this.date, servings: n })
        .then(() => {
            if (!this.addedTemplates.includes(s.t.id)) this.addedTemplates.push(s.t.id);
            App.notification(translate.get('foodAdd.tpl.loggedOk', { name: s.t.name })).show();
            this.tplSheet = null;
        })
        .catch(() => App.notification(translate.get('foodAdd.errors.add')).setType('error').show())
        .finally(() => { this.saving = false; });
    }

    openBuilder(t: any | null) {
        this.builder = t
            ? { id: t.id, name: t.name, kind: t.kind, servings: t.servings, items: t.items.map((i: any) => ({ ...i })) }
            : { id: null, name: '', kind: this.tab === 'recipes' ? 'recipe' : 'meal', servings: 1, items: [] };
        this.bQuery = '';
        this.bResults = [];
        this.bPick = null;
    }

    onBuilderQuery() {
        clearTimeout(this.bTimer);
        this.bPick = null;
        this.bTimer = setTimeout(() => {
            const q = this.bQuery.trim();
            if (!q) { this.bResults = []; return; }
            http.get('/foods').data({ scope: 'all', q, pageSize: 8 })
            .then((res: any) => { if (q === this.bQuery.trim()) this.bResults = res.items ?? []; })
            .catch(() => {});
        }, 250);
    }

    pickBuilderFood(food: any) {
        this.bPick = { food, amount: food.unit === 'u' ? 1 : 100 };
    }

    addBuilderItem() {
        const p = this.bPick;
        const a = Number(p?.amount);
        if (!this.builder || !p || Number.isNaN(a) || a <= 0) return;
        const k = p.food.unit === 'u' ? a : a / 100;
        this.builder.items.push({
            food_id: p.food.id, name: `${String(p.food.name).slice(0, 120)} (${a} ${this.unitLabel(p.food)})`, amount: a,
            kcal: Math.round(p.food.kcal_100 * k), protein_g: p.food.protein_100 ? Math.round(p.food.protein_100 * k * 10) / 10 : null,
        });
        this.bPick = null;
        this.bQuery = '';
        this.bResults = [];
    }

    removeBuilderItem(i: number) {
        this.builder?.items.splice(i, 1);
    }

    // What is logged now in the selected meal becomes the foods of the meal being built
    importMeal() {
        if (!this.builder) return;
        http.get('/nutrition/day').data({ date: this.date })
        .then((res: any) => {
            const entries = (res.entries ?? []).filter((e: any) => e.meal === this.meal);
            if (!entries.length) {
                App.notification(translate.get('foodAdd.tpl.importEmpty')).show();
                return;
            }
            for (const e of entries) {
                this.builder?.items.push({
                    food_id: e.food_id ?? null, name: e.name, amount: e.amount ?? null, kcal: e.kcal, protein_g: e.protein_g ?? null,
                });
            }
        })
        .catch(() => App.notification(translate.get('foodAdd.errors.tplLoad')).setType('error').show());
    }

    get builderKcal(): number {
        const b = this.builder;
        if (!b) return 0;
        const div = b.kind === 'recipe' ? Math.max(Number(b.servings) || 1, 0.1) : 1;
        return Math.round(b.items.reduce((s, i) => s + i.kcal, 0) / div);
    }

    get builderValid(): boolean {
        const b = this.builder;
        if (!b || !b.name.trim() || !b.items.length) return false;
        return b.kind !== 'recipe' || (Number(b.servings) >= 0.5 && Number(b.servings) <= 100);
    }

    saveBuilder() {
        const b = this.builder;
        if (!b || !this.builderValid || this.saving) return;
        this.saving = true;
        const body = { name: b.name.trim(), kind: b.kind, servings: b.kind === 'recipe' ? Number(b.servings) : 1, items: b.items };
        const req = b.id ? http.put(`/meal-templates/${b.id}`).data(body) : http.post('/meal-templates').data(body);
        req.then(() => {
            this.builder = null;
            App.notification(translate.get('foodAdd.tpl.saved')).show();
            this.tab = body.kind === 'recipe' ? 'recipes' : 'meals';
            this.reload();
        })
        .catch((e: any) => {
            const key = e?.data?.error === 'name.taken' ? 'nameTaken' : 'tpl';
            App.notification(translate.get(`foodAdd.errors.${key}`)).setType('error').show();
        })
        .finally(() => { this.saving = false; });
    }

    deleteBuilder() {
        const b = this.builder;
        if (!b?.id) return;
        App.confirm(translate.get('foodAdd.tpl.confirmDelete', { name: b.name }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/meal-templates/${b.id}`)
            .then(() => { this.builder = null; this.reload(); })
            .catch(() => App.notification(translate.get('foodAdd.errors.tplDelete')).setType('error').show());
        });
    }
}
export default toNative(FoodAddPage);
