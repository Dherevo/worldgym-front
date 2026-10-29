import { Component, Vue, toNative } from "vue-facing-decorator";
import TabBar from "@/components/tab-bar/tab-bar.vue";
import WorkoutsPage from "@/pages/workouts/workouts.vue";
import StatsPage from "@/pages/stats/stats.vue";
import MeasurementsPage from "@/pages/measurements/measurements.vue";

// History, statistics and body measurements in one page; the tab is the route
@Component({ components: { TabBar, WorkoutsPage, StatsPage, MeasurementsPage } })
class ProgressPage extends Vue {

    readonly tabs = [
        { path: '/workouts', label: 'layout.menu.history' },
        { path: '/stats', label: 'layout.menu.stats' },
        { path: '/measurements', label: 'layout.menu.measurements' },
    ];

    get tab(): string {
        const path = this.$route.path;
        return path === '/stats' ? 'stats' : path === '/measurements' ? 'measurements' : 'workouts';
    }
}
export default toNative(ProgressPage);
