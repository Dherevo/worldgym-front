import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import userStore from "@/modules/userStore";
import { baseExpenditure, basalMetabolicRate, bmi, effectiveGoal, goalRange } from "@/modules/calories";
import type { Goal } from "@/modules/calories";

// Basal metabolic rate, the sedentary expenditure and the calories to eat for the chosen goal
@Component({})
class EnergyCard extends Vue {

    readonly goals: Goal[] = ['lose', 'maintain', 'gain'];
    saving = false;

    get user(): any {
        return userStore.data;
    }

    get bmr(): number | null {
        return basalMetabolicRate(this.user);
    }

    get base(): number | null {
        return this.bmr ? baseExpenditure(this.bmr) : null;
    }

    get goal(): Goal {
        return effectiveGoal(this.user);
    }

    // Chosen by the user, or suggested by the BMI while they have not chosen
    get isAuto(): boolean {
        return !this.user?.goal;
    }

    get bmiLabel(): string {
        const b = bmi(this.user);
        return b === null ? '' : (Math.round(b * 10) / 10).toString();
    }

    get autoGoalLabel(): string {
        return translate.get(`energy.goals.${this.goal}`).toLowerCase();
    }

    // Calories to eat on a day without a workout
    get restRange(): string {
        if (!this.base || !this.bmr) return '';
        const r = goalRange(this.goal, this.base, this.bmr);
        return `${r.min} - ${r.max}`;
    }

    setGoal(goal: Goal) {
        if (this.saving || this.user?.goal === goal) return;
        this.saving = true;
        http.put('/account/goal').data({ goal })
        .then(() => { userStore.data = { ...userStore.data!, goal }; })
        .catch(() => App.notification(translate.get('nutrition.errors.save')).setType('error').show())
        .finally(() => { this.saving = false; });
    }
}
export default toNative(EnergyCard);
