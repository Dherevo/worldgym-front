import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import CheckIn from "@/components/check-in/check-in.vue";
import localDate from "@/modules/localDate";
import { routineWhy, routineDayLabel } from "@/modules/routineWhy";
import ExerciseAnimation from "@/components/exercise-animation/exercise-animation.vue";

@Component({ components: { ExerciseAnimation, CheckIn } })
class RecommendationPage extends Vue {

    readonly minuteOptions = [30, 45, 60, 75, 90];

    // Where and with what: the gym (all), machines only, free weights and bodyweight, or home
    readonly places = ['gym', 'machines', 'free', 'home'];
    place = 'gym';
    saving = false;
    saved = false;
    minutes = 60;
    variant = 0;
    proposal: any = null;
    loading = false;
    starting = false;

    created() {
        try {
            const saved = localStorage.getItem('wg_rec_location');
            if (saved && this.places.includes(saved)) this.place = saved;
        } catch { /* ignorat */ }
        this.fetchProposal();
    }

    get location(): 'gym' | 'home' {
        return this.place === 'home' ? 'home' : 'gym';
    }

    fetchProposal() {
        this.loading = true;
        this.saved = false;
        const style = this.place === 'machines' || this.place === 'free' ? this.place : 'all';
        http.get('/recommendation').data({ location: this.location, style, minutes: this.minutes, variant: this.variant, date: localDate() })
        .then((res: any) => { this.proposal = res; })
        .catch(() => {
            this.proposal = null;
            App.notification(translate.get('recommendation.error')).setType('error').show();
        })
        .finally(() => { this.loading = false; });
    }

    // A changed filter starts again from the first proposal
    onFilterChange() {
        try { localStorage.setItem('wg_rec_location', this.place); } catch { /* ignorat */ }
        this.variant = 0;
        this.fetchProposal();
    }

    anotherProposal() {
        this.variant++;
        this.fetchProposal();
    }

    readonly routineWhy = routineWhy;
    readonly routineDayLabel = routineDayLabel;

    // Starts the day of a ready-made routine that was proposed (the exercises are filled in as the routine says)
    startRoutine(r: any) {
        if (this.starting) return;
        this.starting = true;
        http.post(`/routines/${r.id}/days/${r.day.id}/start`).data({ date: localDate(), notes: r.day.name || r.name })
        .then((res: any) => { this.to(`/workout/${res.id}`); })
        .catch(() => App.notification(translate.get('recommendation.error')).setType('error').show())
        .finally(() => { this.starting = false; });
    }

    // Keeps the proposal as a private routine of the user (one day) to repeat or edit it
    saveAsRoutine() {
        if (!this.proposal?.exercises?.length || this.saving || this.saved) return;
        this.saving = true;
        const name = translate.get('recommendation.save.name', { date: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) });
        http.post('/recommendation/save').data({
            name,
            exercises: this.proposal.exercises.map((e: any) => ({
                exercise_id: e.exercise.id, sets: e.sets, reps: e.reps, rest_seconds: e.rest_seconds, weight_target: e.weight_target,
            })),
        })
        .then(() => {
            this.saved = true;
            App.notification(translate.get('recommendation.save.done', { name })).setType('success').show();
        })
        .catch(() => App.notification(translate.get('recommendation.save.error')).setType('error').show())
        .finally(() => { this.saving = false; });
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
