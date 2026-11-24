import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import userStore from "@/modules/userStore";
import { activityLevel, baseExpenditure, basalMetabolicRate, bmi, effectiveGoal, goalRange, lossDeficit, proteinRange, stepsBaseline, waistRatio, weeklyLoss, WEEKLY_LOSSES } from "@/modules/calories";
import type { Activity, Goal } from "@/modules/calories";

// Lifestyle (activity) and goal of the user, and the calories and protein to eat for them. The goal is suggested from the BMI
// (and the waist) until the user chooses one
@Component({})
class GoalCard extends Vue {

    readonly goals: Goal[] = ['lose', 'maintain', 'gain'];
    readonly activities: Activity[] = ['sedentary', 'light', 'active'];
    saving = false;

    get user(): any {
        return userStore.data;
    }

    get bmr(): number | null {
        return basalMetabolicRate(this.user);
    }

    get base(): number | null {
        return this.bmr ? baseExpenditure(this.bmr, this.activity) : null;
    }

    // Pace of weight loss (kg a week): only when the goal is to lose weight; null = automatic
    readonly losses = WEEKLY_LOSSES;

    get loss(): number | null {
        return weeklyLoss(this.user);
    }

    lossKcal(kg: number): number {
        return lossDeficit(kg);
    }

    setLoss(loss: number | null) {
        if (this.saving || this.loss === loss) return;
        this.saving = true;
        http.put('/account/weekly-loss').data({ weekly_loss: loss })
        .then(() => { userStore.data = { ...userStore.data!, weekly_loss: loss }; })
        .catch(() => App.notification(translate.get('nutrition.errors.save')).setType('error').show())
        .finally(() => { this.saving = false; });
    }

    get activity(): Activity {
        return activityLevel(this.user);
    }

    setActivity(activity: Activity) {
        if (this.saving || this.activity === activity) return;
        this.saving = true;
        http.put('/account/activity').data({ activity })
        .then(() => { userStore.data = { ...userStore.data!, activity }; })
        .catch(() => App.notification(translate.get('nutrition.errors.save')).setType('error').show())
        .finally(() => { this.saving = false; });
    }

    get goal(): Goal {
        return effectiveGoal(this.user);
    }

    // Chosen by the user, or suggested by the BMI while they have not chosen
    get isAuto(): boolean {
        return !this.user?.goal;
    }

    // Steps a day that the base of the chosen lifestyle already counts (only the ones above add calories)
    get stepsBaselineLabel(): string {
        return stepsBaseline(this.user).toLocaleString(({ ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as any)[translate.currentLanguage] ?? 'ca-ES');
    }

    // A high BMI with a lean waist: the suggestion is not to lose weight
    get leanWaist(): boolean {
        const b = bmi(this.user);
        const r = waistRatio(this.user);
        return b !== null && b >= 25 && r !== null && r < 0.5;
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
        const r = goalRange(this.goal, this.base, this.bmr, { base: this.base, bmi: bmi(this.user), loss: weeklyLoss(this.user) });
        return `${r.min} - ${r.max}`;
    }

    get proteinLabel(): string {
        const p = proteinRange(this.user, this.goal);
        return p ? `${p.min} - ${p.max}` : '';
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
export default toNative(GoalCard);
