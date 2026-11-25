import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import localDate from "@/modules/localDate";
import BackButton from "@/components/back-button/back-button.vue";
import ExerciseAnimation from "@/components/exercise-animation/exercise-animation.vue";

// The ready-made routines as cards with the animation of one of their exercises. The ones that fit today go first
@Component({ components: { BackButton, ExerciseAnimation } })
class RoutineTemplatesPage extends Vue {

    // Tags offered as filter (the card shows the rest)
    readonly filterTags = ['home', 'gym', 'low-impact', 'beginner', 'intermediate'];

    items: any[] = [];
    recommended: { id: number; reasons: string[] }[] = [];
    loading = true;
    filter = '';
    // The animation of a card starts when it comes into view: 18 at once would be heavy
    seen: Record<number, boolean> = {};
    observer: IntersectionObserver | null = null;

    created() {
        let location = 'gym';
        try { if (localStorage.getItem('wg_rec_location') === 'home') location = 'home'; } catch { /* ignorat */ }

        http.get('/routine-templates').data({ location, date: localDate() })
        .then((res: any) => {
            this.items = res.items ?? [];
            this.recommended = res.recommended ?? [];
        })
        .catch(() => App.notification(translate.get('routineTemplates.errLoad')).setType('error').show())
        .finally(() => { this.loading = false; this.$nextTick(() => this.watchCovers()); });
    }

    beforeUnmount() {
        this.observer?.disconnect();
    }

    tagLabel(t: string): string {
        const key = `routineTemplates.tags.${t}`;
        const label = translate.get(key);
        return label === key ? t : label;
    }

    get shown(): any[] {
        const rank = (id: number) => { const i = this.recommended.findIndex(r => r.id === id); return i < 0 ? 99 : i; };
        return this.items
            .filter(r => !this.filter || r.tags.includes(this.filter))
            .sort((a, b) => rank(a.id) - rank(b.id) || a.id - b.id);
    }

    // The first reason that makes it fit today, as a sentence; '' when it is not one of the recommended
    reasonsOf(r: any): string {
        const rec = this.recommended.find(x => x.id === r.id);
        const why = rec?.reasons.find(k => k === 'gentle' || k === 'intense' || k === 'beginner') ?? rec?.reasons[0];
        return rec && why ? translate.get(`routineTemplates.why.${why}`) : '';
    }

    watchCovers() {
        this.observer?.disconnect();
        this.observer = new IntersectionObserver(entries => {
            for (const e of entries) {
                if (!e.isIntersecting) continue;
                this.seen[Number((e.target as HTMLElement).dataset.id)] = true;
                this.observer?.unobserve(e.target);
            }
        }, { rootMargin: '200px' });
        (this.$el as HTMLElement).querySelectorAll('.rt-cover').forEach(el => this.observer?.observe(el));
    }

    goBack() {
        if (window.history.state?.back) this.back();
        else this.to('/routines');
    }
}
export default toNative(RoutineTemplatesPage);
