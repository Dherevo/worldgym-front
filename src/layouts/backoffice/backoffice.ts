import { Component, Vue, Prop, toNative } from "vue-facing-decorator";
import { App, BackofficeLayout, Popup, Avatar } from "lib";
import auth from "@/modules/auth";
import userStore from "@/modules/userStore";

@Component({
    components: { BackofficeLayout, Popup, Avatar },
})
class Backoffice extends Vue {

    @Prop
    page?: () => any

    user: any = null;
    isDark = true;

    created() {
        const saved = localStorage.getItem('wg_theme') || 'dark';
        this.isDark = saved === 'dark';
        document.documentElement.setAttribute('data-theme', saved);

        this.page!().loading = true;
        auth.isLoggedIn()
        .then(() => {
            this.page!().loading = false;
            if (userStore.data) {
                this.user = userStore.data;
            } else {
                auth.fetchUserData().then(() => {
                    this.user = userStore.data;
                });
            }
        })
        .catch(() => this.to('/login'))
    }

    toggleTheme() {
        this.isDark = !this.isDark;
        const theme = this.isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('wg_theme', theme);
    }

    isActive(path: string): boolean {
        return location.pathname === path;
    }

    logout() {
        App.confirm('Vols tancar la sessió?')
        .then((value: boolean) => {
            if (value) {
                auth.logout();
                this.to('/login');
            }
        });
    }
}
export default toNative(Backoffice);
