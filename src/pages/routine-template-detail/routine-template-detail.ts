import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import BackButton from "@/components/back-button/back-button.vue";
import ExerciseAnimation from "@/components/exercise-animation/exercise-animation.vue";
import { hasMedia } from "@/modules/exerciseMedia";

// A ready-made routine in detail: what it is, its days and exercises with their animation, and the button to copy it to the user's routines
@Component({ components: { BackButton, ExerciseAnimation } })
class RoutineTemplateDetailPage extends Vue {

    routine: any = null;
    loading = true;
    cloning = false;
    // Days that were opened: only those draw their exercises (and so load their animations)
    opened: Record<number, boolean> = {};

    created() {
        http.get(`/routines/${this.$route.params.id}`)
        .then((res: any) => {
            this.routine = { ...res, days: res.days ?? [] };
            if (this.routine.days[0]) this.opened[this.routine.days[0].id] = true;
        })
        .catch(() => {
            App.notification(translate.get('routineTemplates.errLoad')).setType('error').show();
            this.goBack();
        })
        .finally(() => { this.loading = false; });
    }

    onToggle(day: any, e: Event) {
        if ((e.target as HTMLDetailsElement).open) this.opened[day.id] = true;
    }

    get tags(): string[] {
        return String(this.routine?.tags ?? '').split(',').filter(Boolean);
    }

    get exerciseCount(): number {
        return this.routine.days.reduce((n: number, d: any) => n + (d.exercises?.length ?? 0), 0);
    }

    // The same estimate as the cards: sets of 45 s plus the rest, per session
    get minutes(): number {
        const days = Math.max(this.routine.days.length, 1);
        let seconds = 0;
        for (const d of this.routine.days) for (const e of d.exercises ?? []) seconds += (e.sets_target || 3) * (45 + (e.rest_seconds ?? 60));
        return Math.round(seconds / days / 60 / 5) * 5;
    }

    // The first exercise that has an animation is the cover
    get cover(): any | null {
        for (const d of this.routine.days) for (const e of d.exercises ?? []) if (e.exercise && hasMedia(e.exercise)) return e.exercise;
        return null;
    }

    tagLabel(t: string): string {
        const key = `routineTemplates.tags.${t}`;
        const label = translate.get(key);
        return label === key ? t : label;
    }

    // "3 × 12 · descans 60s"; a held exercise has seconds
    detailOf(ex: any): string {
        const reps = ex.exercise?.is_timed && ex.reps_target ? `${ex.reps_target} s` : ex.reps_target;
        const parts = [`${ex.sets_target ?? '—'} × ${reps ?? '—'}`];
        if (ex.rest_seconds) parts.push(`${translate.get('routineTemplates.rest')} ${ex.rest_seconds}s`);
        return parts.join(' · ');
    }

    useRoutine() {
        if (this.cloning) return;
        const r = this.routine;
        this.cloning = true;
        http.post(`/routines/${r.id}/clone`).data({})
        .then((created: any) => {
            App.notification(translate.get('routineTemplates.cloned', { name: r.name })).setType('success').show();
            return App.confirm(translate.get('routineTemplates.askDefault', { name: created.name }))
            .then((ok: boolean) => ok
                ? http.put(`/routines/${created.id}/set-default`).data({ active: true }).catch(() => {
                    App.notification(translate.get('routines.errors.setDefault')).setType('error').show();
                })
                : null)
            .then(() => this.to('/routines/' + created.id));
        })
        .catch(() => App.notification(translate.get('routineTemplates.errClone')).setType('error').show())
        .finally(() => { this.cloning = false; });
    }

    goBack() {
        if (window.history.state?.back) this.back();
        else this.to('/routine-templates');
    }
}
export default toNative(RoutineTemplateDetailPage);
