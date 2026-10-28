import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import auth from "@/modules/auth";
import userStore from "@/modules/userStore";

@Component({})
class ProfilePage extends Vue {

    readonly genders = ['female', 'male', 'other'];

    height = '';
    weight = '';
    gender = '';
    saving = false;

    // Equipment at home, for the home sessions the recommender proposes
    equipments: any[] = [];
    homeIds: number[] = [];
    savingEquipment = false;

    created() {
        // The layout may still be fetching the user on a fresh load
        (userStore.data ? Promise.resolve() : auth.fetchUserData())
        .then(() => this.fill())
        .catch(() => {});

        http.get('/equipment').data({ pageSize: 100 })
        .then((res: any) => { this.equipments = res.items ?? []; })
        .catch(() => {});
    }

    fill() {
        const user = userStore.data;
        this.height = user?.height_cm ? String(user.height_cm) : '';
        this.weight = user?.weight_kg ? String(user.weight_kg) : '';
        this.gender = user?.gender ?? '';
        this.homeIds = [...(user?.home_equipment ?? [])];
    }

    toggleHome(id: number) {
        this.homeIds = this.homeIds.includes(id) ? this.homeIds.filter(i => i !== id) : [...this.homeIds, id];
    }

    saveEquipment() {
        if (this.savingEquipment) return;
        this.savingEquipment = true;
        http.put('/account/home-equipment').data({ equipment_ids: this.homeIds })
        .then((user: any) => {
            if (userStore.data) Object.assign(userStore.data, user);
            App.notification(translate.get('recommendation.homeEquipment.saved')).setType('success').show();
        })
        .catch(() => App.notification(translate.get('recommendation.homeEquipment.error')).setType('error').show())
        .finally(() => { this.savingEquipment = false; });
    }

    get valid(): boolean {
        const h = Number(this.height);
        const w = Number(this.weight);
        return h >= 100 && h <= 250 && w >= 30 && w <= 300 && !!this.gender;
    }

    save() {
        if (this.saving || !this.valid) return;
        this.saving = true;
        http.put('/account/profile')
        .data({ height_cm: Math.round(Number(this.height)), weight_kg: Number(this.weight), gender: this.gender })
        .then((user: any) => {
            // Update in place: the layout holds a reference to this same object, and the
            // cycle menu entry depends on the gender
            if (userStore.data) Object.assign(userStore.data, user);
            else userStore.data = user;
            this.fill();
            App.notification(translate.get('profile.saved')).setType('success').show();
        })
        .catch(() => App.notification(translate.get('profile.error')).setType('error').show())
        .finally(() => { this.saving = false; });
    }
}
export default toNative(ProfilePage);
