import { Component, Vue, toNative } from "vue-facing-decorator";
import WorkoutsPage from "@/pages/workouts/workouts.vue";
import BackButton from "@/components/back-button/back-button.vue";

// The workout history (it used to be a tab of Progrés): a page of its own with a back button
@Component({ components: { WorkoutsPage, BackButton } })
class WorkoutHistoryPage extends Vue {
    goBack() {
        if (window.history.state?.back) this.back();
        else this.to('/stats');
    }
}
export default toNative(WorkoutHistoryPage);
