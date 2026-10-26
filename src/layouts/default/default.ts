import { Component, Vue, Prop, toNative } from "vue-facing-decorator";
import auth from "@/modules/auth";

@Component({ })
class DefaultLayout extends Vue {

    @Prop
    page?: () => any

    created() {
        this.page!().loading = true;
        auth.isLoggedIn()
        .then(() => {
            this.to('/');
        })
        .catch(() => {
            this.page!().loading = false;
        })
    }
}
export default toNative(DefaultLayout);
