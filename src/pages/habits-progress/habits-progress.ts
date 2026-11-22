import { Component, Vue, toNative } from "vue-facing-decorator";
import HabitsStreak from "@/components/habits-streak/habits-streak.vue";

// Tab of Progress: the streak of the daily must-dos and the history of each habit, with the way to the habit settings
@Component({ components: { HabitsStreak } })
class HabitsProgressPage extends Vue {
}
export default toNative(HabitsProgressPage);
