import { Component, Vue, toNative } from "vue-facing-decorator";
import { isApp } from "@/modules/platform";
import TabBar from "@/components/tab-bar/tab-bar.vue";
import SwipePager from "@/components/swipe-pager/swipe-pager.vue";
import WorkoutsPage from "@/pages/workouts/workouts.vue";
import StatsPage from "@/pages/stats/stats.vue";
import RoutinesPage from "@/pages/routines/routines.vue";
import ExercisesPage from "@/pages/exercises/exercises.vue";
import FoodHistoryPage from "@/pages/food-history/food-history.vue";
import HabitsProgressPage from "@/pages/habits-progress/habits-progress.vue";

// Workout area: history, statistics, routines and exercises in one page; the tab is the route
@Component({ components: { TabBar, SwipePager, WorkoutsPage, StatsPage, RoutinesPage, ExercisesPage, FoodHistoryPage, HabitsProgressPage } })
class ProgressPage extends Vue {

    readonly tabs = [
        { path: '/stats', label: 'layout.menu.stats' },
        { path: '/nutrition/history', label: 'layout.menu.foodHistory' },
        { path: '/habit-progress', label: 'layout.menu.habits' },
        { path: '/workouts', label: 'layout.menu.history' },
        { path: '/routines', label: 'layout.menu.routines' },
        { path: '/exercises', label: 'layout.menu.exercises' },
    ];

    readonly isApp = isApp;

    // One panel per tab, in the order of `tabs`
    readonly panels = ['StatsPage', 'FoodHistoryPage', 'HabitsProgressPage', 'WorkoutsPage', 'RoutinesPage', 'ExercisesPage'];

    get tabIndex(): number {
        const i = this.tabs.findIndex(t => t.path === this.$route.path);
        return i < 0 ? 3 : i;   // history
    }

    // A page of the pager was turned: the route follows
    onPager(i: number) {
        this.to(this.tabs[i].path);
    }

    get tab(): string {
        const path = this.$route.path;
        if (path === '/stats') return 'stats';
        if (path === '/nutrition/history') return 'food';
        if (path === '/habit-progress') return 'habits';
        if (path === '/routines') return 'routines';
        if (path === '/exercises') return 'exercises';
        return 'workouts';
    }
}
export default toNative(ProgressPage);
