import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, translate } from "lib";
import auth from "@/modules/auth";
import userStore from "@/modules/userStore";

@Component({})
class OnboardingPage extends Vue {

    readonly genders = ['female', 'male', 'other'];

    height = '';
    weight = '';
    gender = '';
    ready = false;
    saving = false;
    error = '';

    created() {
        auth.isLoggedIn()
        .then(() => userStore.data ? null : auth.fetchUserData())
        .then(() => {
            const user = userStore.data;
            if (!auth.needsProfile(user)) {
                this.to('/');
                return;
            }
            // Keep whatever the user had already filled in
            this.height = user?.height_cm ? String(user.height_cm) : '';
            this.weight = user?.weight_kg ? String(user.weight_kg) : '';
            this.gender = user?.gender ?? '';
            this.ready = true;
        })
        .catch(() => this.to('/login'));
    }

    get valid(): boolean {
        const h = Number(this.height);
        const w = Number(this.weight);
        return h >= 100 && h <= 250 && w >= 30 && w <= 300 && !!this.gender;
    }

    submit() {
        if (this.saving || !this.valid) return;
        this.saving = true;
        this.error = '';
        http.put('/account/profile')
        .data({ height_cm: Math.round(Number(this.height)), weight_kg: Number(this.weight), gender: this.gender })
        .then((user: any) => {
            userStore.data = user;
            // Women get the cycle tracker as an extra screen
            this.to(user.gender === 'female' ? '/cycle' : '/');
        })
        .catch(() => { this.error = translate.get('onboarding.error'); })
        .finally(() => { this.saving = false; });
    }
}
export default toNative(OnboardingPage);
