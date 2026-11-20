import { Component, Vue, Prop, Watch, toNative } from "vue-facing-decorator";
import { BackofficeLayout, Popup, Avatar } from "lib";
import auth from "@/modules/auth";
import userStore from "@/modules/userStore";
import { applyUserPalette } from "@/modules/theme";
import { LANGUAGES, currentLanguage, setLanguage, isDarkTheme, toggleDarkTheme, logout } from "@/modules/preferences";
import { isApp } from "@/modules/platform";
import UserAvatar from "@/components/user-avatar/user-avatar.vue";

// App (Capacitor): bottom tab bar + avatar (profile) in the top bar.
// Web: side menu (slides in below 1100px, permanent on wide screens).
@Component({
    components: { BackofficeLayout, Popup, Avatar, UserAvatar },
})
class Backoffice extends Vue {

    @Prop
    page?: () => any

    user: any = null;
    isDark = isDarkTheme();
    menuOpen = false;
    readonly isApp = isApp;

    readonly baseMenuItems = [
        { path: '/',          icon: 'prime/home',      label: 'layout.menu.dashboard' },
        // Grouped entries: `match` lists every route of the group so the entry stays active on all its tabs
        { path: '/stats',     icon: 'prime/bolt',      label: 'layout.menu.progress', short: 'layout.menu.progressShort', match: ['/workouts', '/stats', '/routines', '/exercises'] },
        { path: '/challenges', icon: 'awesome-solid/trophy',   label: 'layout.menu.challenges' },
        { path: '/nutrition', icon: 'awesome-solid/utensils', label: 'layout.menu.nutrition' },
    ];

    get menuItems() {
        // The period tracker is only offered to users who set their gender to female
        return this.user?.gender === 'female'
            ? [...this.baseMenuItems, { path: '/cycle', icon: 'prime/heart', label: 'layout.menu.cycle' }]
            : this.baseMenuItems;
    }

    readonly languages = LANGUAGES;

    get currentLanguage(): string {
        return currentLanguage();
    }

    setLanguage(code: string) {
        setLanguage(code);
    }

    @Watch('$route.path')
    onRouteChange() {
        this.menuOpen = false;
    }

    onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.menuOpen = false;
    };

    // Web: swipe right opens the side menu, swipe left closes it (touch screens; the menu is permanent on wide ones)
    private swipe: { x: number; y: number } | null = null;

    onTouchStart = (e: TouchEvent) => {
        this.swipe = null;
        if (e.touches.length !== 1 || window.innerWidth >= 1100) return;

        // Do not hijack horizontal gestures meant for inputs or scrollable strips (day selector, tables…)
        let el = e.target as HTMLElement | null;
        while (el && el !== document.body) {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
            if (el.scrollWidth > el.clientWidth + 1 && ['auto', 'scroll'].includes(getComputedStyle(el).overflowX)) return;
            el = el.parentElement;
        }
        this.swipe = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    onTouchEnd = (e: TouchEvent) => {
        const start = this.swipe;
        this.swipe = null;
        if (!start || !e.changedTouches.length) return;

        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;

        if (dx > 0 && !this.menuOpen) this.menuOpen = true;
        else if (dx < 0 && this.menuOpen) this.menuOpen = false;
    };

    mounted() {
        document.documentElement.classList.toggle('is-app', isApp);
        if (isApp) return;
        document.addEventListener('keydown', this.onKeydown);
        document.addEventListener('touchstart', this.onTouchStart, { passive: true });
        document.addEventListener('touchend', this.onTouchEnd, { passive: true });
    }

    unmounted() {
        document.removeEventListener('keydown', this.onKeydown);
        document.removeEventListener('touchstart', this.onTouchStart);
        document.removeEventListener('touchend', this.onTouchEnd);
    }

    created() {
        const saved = localStorage.getItem('wg_theme') || 'dark';
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
        applyUserPalette(this.user);
        if (auth.needsProfile(this.user)) this.to('/onboarding');
    }

    toggleTheme() {
        this.isDark = toggleDarkTheme();
    }

    isActive(item: { path: string; match?: string[] }): boolean {
        return (item.match ?? [item.path]).some(p => location.pathname === p || (p !== '/' && location.pathname.startsWith(p + '/')));
    }

    isProfileActive(): boolean {
        return this.isActive({ path: '/profile', match: ['/profile', '/measurements', '/habits'] });
    }

    logout() {
        this.menuOpen = false;
        logout().then((done: boolean) => { if (done) this.to('/login'); });
    }
}
export default toNative(Backoffice);
