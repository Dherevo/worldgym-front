import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import localDate from "@/modules/localDate";

// 10-second daily check-in (energy, sleep, pain). It feeds the recommended session.
@Component({ emits: ['saved'] })
class CheckIn extends Vue {

    readonly fields = ['energy', 'sleep', 'pain'];
    readonly scale = [1, 2, 3, 4, 5];

    values: Record<string, number | null> = { energy: null, sleep: null, pain: null };
    answered = false;
    editing = false;
    loading = true;
    saving = false;

    readonly today = localDate();

    created() {
        http.get('/checkin').data({ date: this.today })
        .then((res: any) => this.apply(res.checkin))
        .catch(() => {})
        .finally(() => { this.loading = false; });
    }

    apply(checkin: any) {
        if (checkin) {
            this.values = { energy: checkin.energy, sleep: checkin.sleep, pain: checkin.pain };
            this.answered = true;
        }
        this.editing = false;
    }

    get complete(): boolean {
        return this.fields.every(f => this.values[f] !== null);
    }

    save() {
        if (!this.complete || this.saving) return;
        this.saving = true;
        http.put('/checkin').data({ ...this.values, date: this.today })
        .then((res: any) => {
            this.apply(res.checkin);
            this.$emit('saved', res.checkin);
        })
        .catch(() => App.notification(translate.get('checkin.error')).setType('error').show())
        .finally(() => { this.saving = false; });
    }
}
export default toNative(CheckIn);
