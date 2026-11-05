import { Component, Vue, Prop, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

// Form to create or edit a food of the catalog: its values per 100 g (or 100 ml)
@Component({ emits: ['saved', 'cancel'] })
class FoodForm extends Vue {

    @Prop({ type: Object, default: null })
    food!: any | null;

    // Name to start with when creating (what the user was searching)
    @Prop({ type: String, default: '' })
    presetName!: string;

    name = '';
    unit: 'g' | 'ml' | 'u' = 'g';
    kcal: number | string = '';
    protein: number | string = '';
    unitG: number | string = '';
    saving = false;

    created() {
        if (this.food) {
            this.name = this.food.name;
            this.unit = this.food.unit;
            this.kcal = this.food.kcal_100;
            this.protein = this.food.protein_100 || '';
            this.unitG = this.food.unit_g ?? '';
        } else {
            this.name = this.presetName;
        }
    }

    // What the values are for: per unit, or per 100 g / 100 ml
    get per(): string {
        return this.unit === 'u' ? translate.get('nutrition.foods.perUnit') : `/ 100 ${this.unit}`;
    }

    get valid(): boolean {
        const k = Number(this.kcal);
        const p = this.protein === '' ? 0 : Number(this.protein);
        const perUnit = this.unit === 'u';
        const weightOk = !perUnit || this.unitG === '' || Number(this.unitG) > 0;
        return !!this.name.trim() && this.kcal !== '' && k >= 0 && k <= (perUnit ? 5000 : 1000) && p >= 0 && p <= (perUnit ? 500 : 100) && weightOk;
    }

    save() {
        if (!this.valid || this.saving) return;
        this.saving = true;
        const body = { name: this.name.trim(), unit: this.unit, kcal_100: Number(this.kcal), protein_100: this.protein === '' ? 0 : Number(this.protein), unit_g: this.unit === 'u' && this.unitG !== '' ? Number(this.unitG) : null };
        const req = this.food ? http.put(`/foods/${this.food.id}`).data(body) : http.post('/foods').data(body);
        req.then((res: any) => this.$emit('saved', res))
        .catch((e: any) => {
            const key = e?.data?.error === 'name.taken' ? 'foodTaken' : 'foodSave';
            App.notification(translate.get(`nutrition.errors.${key}`)).setType('error').show();
        })
        .finally(() => { this.saving = false; });
    }
}
export default toNative(FoodForm);
