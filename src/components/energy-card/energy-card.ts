import { Component, Vue, toNative } from "vue-facing-decorator";
import { http } from "lib";
import userStore from "@/modules/userStore";
import { activityFactor, basalMetabolicRate } from "@/modules/calories";

// Basal metabolic rate and an estimate of the daily energy spent, from the profile and the recent workouts
@Component({})
class EnergyCard extends Vue {

    sessionsPerWeek = 0;

    get user(): any {
        return userStore.data;
    }

    get bmr(): number | null {
        return basalMetabolicRate(this.user);
    }

    get tdee(): number | null {
        return this.bmr ? Math.round(this.bmr * activityFactor(this.sessionsPerWeek)) : null;
    }

    private round10(n: number): number {
        return Math.round(n / 10) * 10;
    }

    // Moderate deficit (15-20% below the daily expenditure), never under the basal metabolic rate
    get loseRange(): string {
        if (!this.tdee || !this.bmr) return '';
        const low = Math.max(this.bmr, this.round10(this.tdee * 0.80));
        const high = Math.max(low, this.round10(this.tdee * 0.85));
        return `${low} - ${high}`;
    }

    // Small surplus (5-10% above the daily expenditure)
    get gainRange(): string {
        if (!this.tdee) return '';
        return `${this.round10(this.tdee * 1.05)} - ${this.round10(this.tdee * 1.10)}`;
    }

    get perWeekLabel(): string {
        return (Math.round(this.sessionsPerWeek * 10) / 10).toString();
    }

    created() {
        const to = new Date();
        const from = new Date(to.getTime() - 28 * 24 * 3600 * 1000);
        const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        http.get('/workouts').data({ date_from: fmt(from), date_to: fmt(to) })
        .then((res: any) => {
            const finished = (res.items ?? []).filter((w: any) => w.status === 'finished').length;
            this.sessionsPerWeek = finished / 4;
        })
        .catch(() => {});
    }
}
export default toNative(EnergyCard);
