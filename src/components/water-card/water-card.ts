import { Component, Vue, Prop, Watch, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

interface WaterDay {
    date: string;
    total_ml: number;
    goal_ml: number;
    custom: boolean;
    entries: { id: number; ml: number; at: string }[];
}

// Water of a day: a card with the progress and a sheet to log what was drunk (quick glasses or a custom amount),
// fix a mistake and change the daily goal. The API takes up to 5000 ml per call
@Component({})
class WaterCard extends Vue {

    @Prop({ type: String, required: true })
    date!: string;

    readonly quick = [250, 500, 1000];

    day: WaterDay | null = null;
    open = false;
    pending = 0;
    customMl: number | string = '';
    busy = false;
    editingGoal = false;
    goalInput: number | string = '';

    created() {
        this.load();
    }

    @Watch('date')
    onDate() {
        this.day = null;
        this.load();
    }

    load() {
        const date = this.date;
        http.get('/water').data({ date })
        .then((res: any) => { if (date === this.date) this.day = res; })
        .catch(() => {});
    }

    get pct(): number {
        return this.day && this.day.goal_ml > 0 ? Math.round((this.day.total_ml / this.day.goal_ml) * 100) : 0;
    }

    get customValid(): boolean {
        const n = Number(this.customMl);
        return this.customMl !== '' && Number.isInteger(n) && n >= 1 && n <= 5000;
    }

    get goalValid(): boolean {
        const n = Number(this.goalInput);
        return this.goalInput !== '' && Number.isInteger(n) && n >= 500 && n <= 10000;
    }

    openSheet() {
        this.pending = 0;
        this.customMl = '';
        this.editingGoal = false;
        this.open = true;
    }

    closeSheet() {
        this.open = false;
    }

    addCustom() {
        if (!this.customValid) return;
        this.pending += Number(this.customMl);
        this.customMl = '';
    }

    // One logged amount per save: several taps add up first. A total over 5000 ml goes in several calls
    async save() {
        if (this.busy || this.pending <= 0) return;
        this.busy = true;
        try {
            let left = this.pending;
            let res: any = null;
            while (left > 0) {
                const ml = Math.min(left, 5000);
                res = await http.post('/water').data({ ml, date: this.date });
                left -= ml;
            }
            this.day = res;
            this.pending = 0;
            this.open = false;
        } catch {
            App.notification(translate.get('nutrition.water.error')).setType('error').show();
            this.load();
        } finally {
            this.busy = false;
        }
    }

    remove(e: { id: number }) {
        if (this.busy) return;
        this.busy = true;
        http.delete(`/water/${e.id}`)
        .then((res: any) => { this.day = res; })
        .catch(() => App.notification(translate.get('nutrition.water.error')).setType('error').show())
        .finally(() => { this.busy = false; });
    }

    toggleGoal() {
        this.editingGoal = !this.editingGoal;
        this.goalInput = this.day?.goal_ml ?? '';
    }

    // Goal of the user, or null to go back to the general recommendation. The API answers for today: the day is read again
    setGoal(ml: number | null) {
        if (this.busy) return;
        this.busy = true;
        http.put('/water/goal').data({ ml })
        .then(() => { this.editingGoal = false; this.load(); })
        .catch(() => App.notification(translate.get('nutrition.water.error')).setType('error').show())
        .finally(() => { this.busy = false; });
    }

    saveGoal() {
        if (this.goalValid) this.setGoal(Number(this.goalInput));
    }

    resetGoal() {
        this.setGoal(null);
    }
}
export default toNative(WaterCard);
