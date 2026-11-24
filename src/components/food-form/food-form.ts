import { Component, Vue, Prop, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import { loadFoodCategories, categoryName, topCategories, childrenOf } from "@/modules/foodCategories";
import type { FoodCategory } from "@/modules/foodCategories";

// Form to create or edit a food of the catalog: its values per 100 g (or 100 ml). With a barcode, Open Food Facts
// can fill the name, the values, the brand, the fiber, the saturated fat, the carbohydrates and the sodium; fruit and the like have no barcode.
@Component({ emits: ['saved', 'cancel'] })
class FoodForm extends Vue {

    @Prop({ type: Object, default: null })
    food!: any | null;

    // Name to start with when creating (what the user was searching)
    @Prop({ type: String, default: '' })
    presetName!: string;

    // Barcode to start with when creating (a scanned code Open Food Facts does not have)
    @Prop({ type: String, default: '' })
    presetCode!: string;

    name = '';
    brand = '';
    aliases = '';
    offCode = '';
    // Vegetable or fruit: '' = decided by the name, 'yes' or 'no'
    plant: '' | 'yes' | 'no' = '';
    unit: 'g' | 'ml' | 'u' = 'g';
    kcal: number | string = '';
    protein: number | string = '';
    // Per 100 (or per unit): they only come from Open Food Facts or from a food already saved
    fiber: number | string = '';
    saturates: number | string = '';
    carbs: number | string = '';
    fat: number | string = '';
    // Sodium in mg
    sodium: number | string = '';
    unitG: number | string = '';
    // Categories of the catalog: the food can have several (the first one is the main)
    categories: FoodCategory[] = [];
    categoryIds: number[] = [];
    // Amount the kcal and protein typed are for (empty = per 100); saved always per 100
    refAmount: number | string = '';
    saving = false;
    looking = false;
    filled = false;

    created() {
        loadFoodCategories().then(list => { this.categories = list; });
        if (this.food) {
            this.categoryIds = [...(this.food.category_ids ?? [])];
            this.name = this.food.name;
            this.brand = this.food.brand ?? '';
            this.aliases = this.food.aliases ?? '';
            this.offCode = this.food.off_code ?? '';
            this.plant = this.food.plant === true ? 'yes' : this.food.plant === false ? 'no' : '';
            this.unit = this.food.unit;
            this.kcal = this.food.kcal_100;
            this.protein = this.food.protein_100 || '';
            this.fiber = this.food.fiber_100 ?? '';
            this.saturates = this.food.saturates_100 ?? '';
            this.carbs = this.food.carbs_100 ?? '';
            this.fat = this.food.fat_100 ?? '';
            this.sodium = this.food.sodium_100 ?? '';
            this.unitG = this.food.unit_g ?? '';
        } else {
            this.name = this.presetName;
            this.offCode = this.presetCode;
            // A scanned code: ask Open Food Facts again (the first lookup can fail without the product being missing)
            if (this.codeValid) this.lookup(true);
        }
    }

    get topCategories(): FoodCategory[] {
        return topCategories(this.categories);
    }

    childrenOf(c: FoodCategory): FoodCategory[] {
        return childrenOf(this.categories, c.id);
    }

    catName(c: FoodCategory): string {
        return categoryName(c);
    }

    toggleCategory(id: number) {
        const i = this.categoryIds.indexOf(id);
        if (i >= 0) this.categoryIds.splice(i, 1);
        else this.categoryIds.push(id);
    }

    // What the values are for: per unit, or per 100 g / 100 ml
    get per(): string {
        if (this.unit === 'u') return translate.get('nutrition.foods.perUnit');
        return `/ ${this.refValue} ${this.unit}`;
    }

    // Amount the values refer to; 100 unless one is typed (not used for units)
    get refValue(): number {
        const a = Number(this.refAmount);
        return this.unit !== 'u' && this.refAmount !== '' && a > 0 ? a : 100;
    }

    get codeValid(): boolean {
        return /^\d{6,14}$/.test(this.offCode.trim());
    }

    // Empty is fine (no barcode); typed, it has to look like one
    get codeOk(): boolean {
        return this.offCode.trim() === '' || this.codeValid;
    }

    get valid(): boolean {
        const k = Number(this.kcal);
        const p = this.protein === '' ? 0 : Number(this.protein);
        const perUnit = this.unit === 'u';
        const weightOk = !perUnit || this.unitG === '' || Number(this.unitG) > 0;
        const refOk = perUnit || this.refAmount === '' || Number(this.refAmount) > 0;
        // The limits apply to the values per 100, once converted
        const f = this.refValue / 100;
        return !!this.name.trim() && this.kcal !== '' && k >= 0 && k / f <= (perUnit ? 5000 : 1000) && p >= 0 && p / f <= (perUnit ? 500 : 100) && weightOk && refOk && this.codeOk;
    }

    // Scale a value typed for refValue to its value per 100, with up to 2 decimals
    per100(v: number): number {
        return Math.round((v * 100 / this.refValue) * 100) / 100;
    }

    // Fill the form from Open Food Facts by the barcode. It is an explicit action: what is there gets replaced,
    // except the name, which is only filled when empty
    lookup(auto = false) {
        if (!this.codeValid || this.looking) return;
        this.looking = true;
        this.filled = false;

        http.get(`/foods/off/${this.offCode.trim()}`)
        .then((p: any) => {
            if (!this.name.trim()) this.name = p.name;
            this.brand = p.brand ?? this.brand;
            this.unit = p.unit;
            this.refAmount = '';
            this.kcal = p.kcal_100;
            this.protein = p.protein_100 || '';
            this.fiber = p.fiber_100 ?? '';
            this.saturates = p.saturates_100 ?? '';
            this.carbs = p.carbs_100 ?? '';
            this.fat = p.fat_100 ?? '';
            this.sodium = p.sodium_100 ?? '';
            // The category Open Food Facts suggests is added to the ones chosen
            const suggested = this.categories.find(c => c.slug === p.category);
            if (suggested && !this.categoryIds.includes(suggested.id)) this.categoryIds.push(suggested.id);
            this.filled = true;
        })
        .catch((e: any) => {
            if (auto) return;
            const key = e?.data?.error === 'off.unavailable' ? 'nutrition.off.unavailable' : 'nutrition.foods.barcodeNotFound';
            App.notification(translate.get(key)).setType('error').show();
        })
        .finally(() => { this.looking = false; });
    }

    save() {
        if (!this.valid || this.saving) return;
        this.saving = true;
        const optional = (v: number | string) => (v === '' ? null : this.per100(Number(v)));
        const body = {
            name: this.name.trim(),
            unit: this.unit,
            kcal_100: this.per100(Number(this.kcal)),
            protein_100: this.protein === '' ? 0 : this.per100(Number(this.protein)),
            fiber_100: optional(this.fiber),
            saturates_100: optional(this.saturates),
            carbs_100: optional(this.carbs),
            fat_100: optional(this.fat),
            sodium_100: optional(this.sodium),
            brand: this.brand.trim(),
            aliases: this.aliases.trim(),
            plant: this.plant === '' ? null : this.plant === 'yes',
            off_code: this.offCode.trim(),
            unit_g: this.unit === 'u' && this.unitG !== '' ? Number(this.unitG) : null,
            category_ids: this.categoryIds,
        };
        const req = this.food ? http.put(`/foods/${this.food.id}`).data(body) : http.post('/foods').data(body);
        // The amount typed is also what was eaten: it goes with the saved food so the meal row can start with it
        const eaten = !this.food && this.unit !== 'u' && this.refAmount !== '' ? Number(this.refAmount) : null;
        req.then((res: any) => this.$emit('saved', res, eaten))
        .catch((e: any) => {
            const key = e?.data?.error === 'name.taken' ? 'foodTaken' : 'foodSave';
            App.notification(translate.get(`nutrition.errors.${key}`)).setType('error').show();
        })
        .finally(() => { this.saving = false; });
    }
}
export default toNative(FoodForm);
