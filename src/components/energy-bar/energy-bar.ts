import { Component, Vue, Prop, toNative } from "vue-facing-decorator";
import type { EnergyDay } from "@/modules/energyDay";

// Calories eaten against the ones burned today, with the range to eat for the goal marked on the bar
@Component({})
class EnergyBar extends Vue {

    @Prop({ required: true }) day!: EnergyDay;

    // The bar is as long as what was burned (or as what was eaten, if more)
    get scale(): number {
        return Math.max(this.day.burned, this.day.eaten, 1);
    }

    pct(n: number): number {
        return Math.min(100, Math.round((n / this.scale) * 1000) / 10);
    }

    get state(): 'low' | 'ok' | 'over' {
        if (this.day.eaten > this.day.max) return 'over';
        return this.day.eaten >= this.day.min ? 'ok' : 'low';
    }

    // Left to eat inside the goal (its upper end); negative once over it
    get left(): number {
        return this.day.max - this.day.eaten;
    }

    get balance(): number {
        return this.day.eaten - this.day.burned;
    }
}
export default toNative(EnergyBar);
