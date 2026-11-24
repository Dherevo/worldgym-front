import { Component, Vue, toNative } from "vue-facing-decorator";
import { isApp } from "@/modules/platform";
import TabBar from "@/components/tab-bar/tab-bar.vue";
import SwipePager from "@/components/swipe-pager/swipe-pager.vue";
import StatsPage from "@/pages/stats/stats.vue";
import RoutinesPage from "@/pages/routines/routines.vue";
import ExercisesPage from "@/pages/exercises/exercises.vue";
import FoodHistoryPage from "@/pages/food-history/food-history.vue";

// Progrés: statistics, food history, routines and exercises as tabs of one page; the tab is the route
@Component({ components: { TabBar, SwipePager, StatsPage, RoutinesPage, ExercisesPage, FoodHistoryPage } })
class ProgressPage extends Vue {

    readonly tabs = [
        { path: '/stats', label: 'layout.menu.stats' },
        { path: '/nutrition/history', label: 'layout.menu.foodHistory' },
        { path: '/routines', label: 'layout.menu.routines' },
        { path: '/exercises', label: 'layout.menu.exercises' },
    ];

    readonly isApp = isApp;

    // One panel per tab, in the order of `tabs`
    readonly panels = ['StatsPage', 'FoodHistoryPage', 'RoutinesPage', 'ExercisesPage'];

    get tabIndex(): number {
        const i = this.tabs.findIndex(t => t.path === this.$route.path);
        return Math.max(0, i);
    }

    // A page of the pager was turned: the route follows
    onPager(i: number) {
        this.to(this.tabs[i].path);
    }
}
export default toNative(ProgressPage);
