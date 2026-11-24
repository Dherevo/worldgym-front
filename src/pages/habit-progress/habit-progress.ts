import { Component, Vue, toNative } from "vue-facing-decorator";
import HabitsProgressPage from "@/pages/habits-progress/habits-progress.vue";
import BackButton from "@/components/back-button/back-button.vue";

// The habits progress (it used to be a tab of Progrés): a page of its own with a back button
@Component({ components: { HabitsProgressPage, BackButton } })
class HabitProgressPage extends Vue {
    goBack() {
        if (window.history.state?.back) this.back();
        else this.to('/stats');
    }
}
export default toNative(HabitProgressPage);
