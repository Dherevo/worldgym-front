import { Component, Vue, toNative } from "vue-facing-decorator";
import { isApp } from "@/modules/platform";
import { swipeTabs, slideIn } from "@/modules/swipeTabs";
import TabBar from "@/components/tab-bar/tab-bar.vue";
import WorkoutsPage from "@/pages/workouts/workouts.vue";
import StatsPage from "@/pages/stats/stats.vue";
import RoutinesPage from "@/pages/routines/routines.vue";
import ExercisesPage from "@/pages/exercises/exercises.vue";
import FoodHistoryPage from "@/pages/food-history/food-history.vue";
import HabitsProgressPage from "@/pages/habits-progress/habits-progress.vue";

// Workout area: history, statistics, routines and exercises in one page; the tab is the route
@Component({ components: { TabBar, WorkoutsPage, StatsPage, RoutinesPage, ExercisesPage, FoodHistoryPage, HabitsProgressPage } })
class ProgressPage extends Vue {

    readonly tabs = [
        { path: '/stats', label: 'layout.menu.stats' },
        { path: '/nutrition/history', label: 'layout.menu.foodHistory' },
        { path: '/habit-progress', label: 'layout.menu.habits' },
        { path: '/workouts', label: 'layout.menu.history' },
        { path: '/routines', label: 'layout.menu.routines' },
        { path: '/exercises', label: 'layout.menu.exercises' },
    ];

    private stopSwipe: (() => void) | null = null;

    mounted() {
        // App: swipe sideways to move between the tabs
        if (!isApp) return;
        this.stopSwipe = swipeTabs('.tabbed-page', dir => {
            const i = this.tabs.findIndex(t => t.path === this.$route.path);
            const next = this.tabs[(i < 0 ? 3 : i) + dir];   // '/workouts' (history) is the tab when the path is none of the listed ones
            if (!next) return;
            slideIn(document.querySelector<HTMLElement>('.tabbed-page .tab-content'), dir);
            this.to(next.path);
        });
    }

    beforeUnmount() {
        this.stopSwipe?.();
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
