import { Component, Vue, Prop, Watch, toNative } from "vue-facing-decorator";
import { App, BackofficeLayout, Popup, Avatar, http, Storage, translate } from "lib";
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
    menuOpen = false;

    readonly baseMenuItems = [
        { path: '/',          icon: 'prime/home',      label: 'layout.menu.dashboard' },
        { path: '/exercises', icon: 'prime/bolt',      label: 'layout.menu.exercises' },
        { path: '/routines',  icon: 'prime/calendar',  label: 'layout.menu.routines' },
        { path: '/workouts',  icon: 'prime/history',   label: 'layout.menu.history' },
        { path: '/stats',     icon: 'prime/chart-bar', label: 'layout.menu.stats' },
    ];

    get menuItems() {
        // The period tracker is only offered to users who set their gender to female
        return this.user?.gender === 'female'
            ? [...this.baseMenuItems, { path: '/cycle', icon: 'prime/heart', label: 'layout.menu.cycle' }]
            : this.baseMenuItems;
    }

    readonly languages = [
        { code: 'ca', label: 'CA' },
        { code: 'es', label: 'ES' },
        { code: 'en', label: 'EN' },
    ];

    get currentLanguage(): string {
        return translate.currentLanguage;
    }

    setLanguage(code: string) {
        if (code === this.currentLanguage) return;

        Storage.set('language', code);

        // The translation engine keeps its state outside Vue's reactivity system, so switching
        // language does not re-render mounted components or PrimeVue's own locale.
        // A reload picks up the language we just saved via main.ts and keeps everything consistent.
        const persist = this.user
            ? http.put('/account/locale', { locale: code }).promise().catch(() => {})
            : Promise.resolve();

        persist.then(() => window.location.reload());
    }

    @Watch('$route.path')
    onRouteChange() {
        this.menuOpen = false;
    }

    onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.menuOpen = false;
    };

    mounted() {
        document.addEventListener('keydown', this.onKeydown);
    }

    unmounted() {
        document.removeEventListener('keydown', this.onKeydown);
    }

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
                this.requireProfile();
            } else {
                auth.fetchUserData().then(() => {
                    this.user = userStore.data;
                    this.requireProfile();
                });
            }
        })
        .catch(() => this.to('/login'))
    }

    requireProfile() {
        if (auth.needsProfile(this.user)) this.to('/onboarding');
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
        this.menuOpen = false;
        App.confirm(translate.get('layout.logoutConfirm'))
        .then((value: boolean) => {
            if (value) {
                auth.logout();
                this.to('/login');
            }
        });
    }
}
export default toNative(Backoffice);
