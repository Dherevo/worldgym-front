import { Component, Vue, toNative } from "vue-facing-decorator";
import BackButton from "@/components/back-button/back-button.vue";
import FoodHistoryPage from "@/pages/food-history/food-history.vue";

// Page of its own around an existing screen: back arrow on top
@Component({ components: { BackButton, FoodHistoryPage } })
class FoodHistoryWrapPage extends Vue {
    goBack() {
        if (window.history.state?.back) this.back();
        else this.to('/nutrition');
    }
}
export default toNative(FoodHistoryWrapPage);
