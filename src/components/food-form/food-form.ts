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
    unit: 'g' | 'ml' = 'g';
    kcal: number | string = '';
    protein: number | string = '';
    saving = false;

    created() {
        if (this.food) {
            this.name = this.food.name;
            this.unit = this.food.unit;
            this.kcal = this.food.kcal_100;
            this.protein = this.food.protein_100 || '';
        } else {
            this.name = this.presetName;
        }
    }

    get valid(): boolean {
        const k = Number(this.kcal);
        const p = this.protein === '' ? 0 : Number(this.protein);
        return !!this.name.trim() && this.kcal !== '' && k >= 0 && k <= 1000 && p >= 0 && p <= 100;
    }

    save() {
        if (!this.valid || this.saving) return;
        this.saving = true;
        const body = { name: this.name.trim(), unit: this.unit, kcal_100: Number(this.kcal), protein_100: this.protein === '' ? 0 : Number(this.protein) };
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
