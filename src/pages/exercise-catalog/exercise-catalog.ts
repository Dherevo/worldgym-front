import { Component, Vue, toNative } from "vue-facing-decorator";
import BackButton from "@/components/back-button/back-button.vue";
import ExercisesPage from "@/pages/exercises/exercises.vue";

// Page of its own around an existing screen: back arrow on top
@Component({ components: { BackButton, ExercisesPage } })
class ExerciseCatalogPage extends Vue {
    goBack() {
        if (window.history.state?.back) this.back();
        else this.to('/routines');
    }
}
export default toNative(ExerciseCatalogPage);
