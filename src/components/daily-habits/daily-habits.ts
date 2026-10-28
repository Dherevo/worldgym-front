import { Component, Vue, Prop, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import localDate from "@/modules/localDate";

// Daily must-dos (steps, abs, custom) shown on the home page, whatever the routine day is
@Component({})
class DailyHabits extends Vue {

    @Prop({ type: Boolean, default: false })
    restDay!: boolean;

    habits: any[] = [];
    drafts: Record<number, { value: string; sets: string; reps: string }> = {};
    loading = false;
    savingId: number | null = null;

    readonly today = localDate();

    created() {
        this.fetchHabits();
    }

    fetchHabits() {
        this.loading = true;
        http.get('/habits').data({ date: this.today })
        .then((res: any) => this.apply(res))
        .catch(() => App.notification(translate.get('habits.card.errorLoad')).setType('error').show())
        .finally(() => { this.loading = false; });
    }

    apply(res: any) {
        const order = ['warmup', 'steps', 'abs', 'stretch'];
        const rank = (h: any) => (h.key ? order.indexOf(h.key) : order.length);
        this.habits = (res.habits ?? []).filter((h: any) => h.is_active).sort((a: any, b: any) => rank(a) - rank(b));

        const drafts: Record<number, any> = {};
        for (const h of this.habits) {
            drafts[h.id] = {
                value: h.log?.value != null ? String(h.log.value) : '',
                sets: h.log?.sets_done != null ? String(h.log.sets_done) : '',
                reps: h.log?.reps != null ? String(h.log.reps) : '',
            };
        }
        this.drafts = drafts;
    }

    habitName(h: any): string {
        return h.name ?? translate.get(`habits.names.${h.key}`);
    }

    format(n: number): string {
        return n.toLocaleString(({ ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as any)[translate.currentLanguage] ?? 'ca-ES');
    }

    goalLabel(h: any): string {
        if (h.kind === 'steps') return `${this.format(h.target_value)} ${translate.get('habits.card.steps')}`;
        if (h.kind === 'sets') return `${h.target_sets} × ${h.target_reps}`;
        return '';
    }

    progress(h: any): number {
        if (h.log?.completed) return 100;
        if (h.kind === 'steps' && h.target_value) return Math.min(100, Math.round(((h.log?.value ?? 0) / h.target_value) * 100));
        if (h.kind === 'sets' && h.target_sets) return Math.min(100, Math.round(((h.log?.sets_done ?? 0) / h.target_sets) * 100));
        return 0;
    }

    get tip(): string {
        const steps = this.habits.find(h => h.key === 'steps');
        if (!steps) return '';

        const goal = this.format(steps.target_value);
        const walked = steps.log?.value ?? 0;

        if (steps.log?.completed) return translate.get('habits.tips.stepsDone');
        if (walked > 0) return translate.get('habits.tips.stepsLeft', { n: this.format(Math.max(0, steps.target_value - walked)) });
        if (this.restDay) return translate.get('habits.tips.rest', { goal });

        // A different generic tip each day
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        return translate.get(`habits.tips.general${(dayOfYear % 4) + 1}`, { goal });
    }

    private save(h: any, body: any) {
        this.savingId = h.id;
        http.put(`/habits/${h.id}/log`).data({ date: this.today, ...body })
        .then((res: any) => this.apply(res))
        .catch(() => App.notification(translate.get('habits.card.error')).setType('error').show())
        .finally(() => { this.savingId = null; });
    }

    toggle(h: any) {
        this.save(h, { completed: !h.log?.completed });
    }

    saveSteps(h: any) {
        const value = this.drafts[h.id].value;
        if (value === '') return;
        this.save(h, { value: Number(value) });
    }

    saveSets(h: any) {
        const d = this.drafts[h.id];
        if (d.sets === '' && d.reps === '') return;
        this.save(h, { sets_done: Number(d.sets || 0), reps: d.reps === '' ? null : Number(d.reps) });
    }
}
export default toNative(DailyHabits);
