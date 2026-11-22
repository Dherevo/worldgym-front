import { Component, Vue, toNative } from "vue-facing-decorator";
import userStore from "@/modules/userStore";
import { activityLevel, baseExpenditure, basalMetabolicRate } from "@/modules/calories";
import type { Activity } from "@/modules/calories";

// Basal metabolic rate and the sedentary expenditure (the lifestyle and the goal are in the goal card)
@Component({})
class EnergyCard extends Vue {

    get user(): any {
        return userStore.data;
    }

    get bmr(): number | null {
        return basalMetabolicRate(this.user);
    }

    get base(): number | null {
        return this.bmr ? baseExpenditure(this.bmr, this.activity) : null;
    }

    get activity(): Activity {
        return activityLevel(this.user);
    }
}
export default toNative(EnergyCard);
