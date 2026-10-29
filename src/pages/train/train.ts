import { Component, Vue, toNative } from "vue-facing-decorator";
import TabBar from "@/components/tab-bar/tab-bar.vue";
import RoutinesPage from "@/pages/routines/routines.vue";
import ExercisesPage from "@/pages/exercises/exercises.vue";

// Routines and exercises in one page; the tab is the route (/routines, /exercises)
@Component({ components: { TabBar, RoutinesPage, ExercisesPage } })
class TrainPage extends Vue {

    readonly tabs = [
        { path: '/routines', label: 'layout.menu.routines' },
        { path: '/exercises', label: 'layout.menu.exercises' },
    ];

    get tab(): string {
        return this.$route.path === '/exercises' ? 'exercises' : 'routines';
    }
}
export default toNative(TrainPage);
