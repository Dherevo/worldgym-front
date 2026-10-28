import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import CheckIn from "@/components/check-in/check-in.vue";
import localDate from "@/modules/localDate";

@Component({ components: { CheckIn } })
class RecommendationPage extends Vue {

    readonly minuteOptions = [30, 45, 60, 75, 90];

    location: 'gym' | 'home' = 'gym';
    minutes = 60;
    variant = 0;
    proposal: any = null;
    loading = false;
    starting = false;

    created() {
        try {
            const saved = localStorage.getItem('wg_rec_location');
            if (saved === 'home' || saved === 'gym') this.location = saved;
        } catch { /* ignorat */ }
        this.fetchProposal();
    }

    fetchProposal() {
        this.loading = true;
        http.get('/recommendation').data({ location: this.location, minutes: this.minutes, variant: this.variant, date: localDate() })
        .then((res: any) => { this.proposal = res; })
        .catch(() => {
            this.proposal = null;
            App.notification(translate.get('recommendation.error')).setType('error').show();
        })
        .finally(() => { this.loading = false; });
    }

    // A changed filter starts again from the first proposal
    onFilterChange() {
        try { localStorage.setItem('wg_rec_location', this.location); } catch { /* ignorat */ }
        this.variant = 0;
        this.fetchProposal();
    }

    anotherProposal() {
        this.variant++;
        this.fetchProposal();
    }

    start() {
        if (!this.proposal?.exercises?.length || this.starting) return;
        this.starting = true;
        http.post('/recommendation/start').data({
            location: this.location,
            date: localDate(),
            exercises: this.proposal.exercises.map((e: any) => ({
                exercise_id: e.exercise.id,
                sets: e.sets,
                reps: e.reps,
                rest_seconds: e.rest_seconds,
                weight_target: e.weight_target,
            })),
        })
        .then((res: any) => { this.to(`/workout/${res.id}`); })
        .catch(() => App.notification(translate.get('recommendation.error')).setType('error').show())
        .finally(() => { this.starting = false; });
    }
}
export default toNative(RecommendationPage);
