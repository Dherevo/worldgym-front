import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import FoodForm from "@/components/food-form/food-form.vue";
import localDate from "@/modules/localDate";
import { isApp } from "@/modules/platform";
import { scanBarcode } from "@/modules/barcode";
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
@Component({ components: { FoodForm } })
class FoodAddPage extends Vue {

    readonly meals = MEALS;
    readonly isApp = isApp;

    meal = 'breakfast';
    date = localDate();

    categories: FoodCategory[] = [];
    tab = 'mine';
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
    offSearched = false;
    offSaving = false;
    scanning = false;

    foodForm: { preset: string; code: string } | null = null;

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
        this.offResults = [];
        this.offSearched = false;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.reload(), 250);
    }

    reload() {
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

        http.get('/foods').data(data)
        .then((res: any) => {
            if (id !== this.request) return;
            const items = res.items ?? [];
            this.foods = reset ? items : [...this.foods, ...items];
            this.total = res.total ?? 0;
            this.offset = this.foods.length;
        })
        .catch(() => { if (id === this.request) App.notification(translate.get('foodAdd.errors.load')).setType('error').show(); })
        .finally(() => { if (id === this.request) this.loading = false; });
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
    searchOff(): Promise<'found' | 'none' | 'error'> {
        const q = this.query.trim();
        if (q.length < 2 || this.offSearching) return Promise.resolve('error');
        this.offSearching = true;
        this.offSearched = false;

        const isCode = /^\d{6,14}$/.test(q);
        const req = isCode ? http.get(`/foods/off/${q}`) : http.get('/foods/off').data({ q });
        return req.then((res: any) => {
            this.offResults = isCode ? [res] : (res.items ?? []);
            return this.offResults.length ? 'found' : 'none';
        })
        .catch((e: any) => {
            this.offResults = [];
            if (isCode && e?.data?.error !== 'off.unavailable') return 'none';
            App.notification(translate.get('nutrition.off.unavailable')).setType('error').show();
            return 'error';
        })
        .finally(() => { this.offSearching = false; this.offSearched = true; }) as Promise<'found' | 'none' | 'error'>;
    }

    // The product goes to the catalog (shared with every user, with its barcode and nutrients) and its amount sheet opens
    pickOff(p: any) {
        if (this.offSaving) return;
        this.offSaving = true;

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
        .finally(() => { this.offSaving = false; });
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
                    this.foodForm = { preset: '', code: res.code };
                }
            }
        } catch {
            App.notification(translate.get('nutrition.scan.error')).setType('error').show();
        } finally {
            this.scanning = false;
        }
    }

    openFoodForm() {
        this.foodForm = { preset: this.query.trim(), code: '' };
    }

    onFoodSaved(food: any, eaten: number | null = null) {
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
