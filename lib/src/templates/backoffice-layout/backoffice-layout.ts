import { Component, Vue, Prop, toNative } from "vue-facing-decorator";
import TieredMenu from 'primevue/tieredmenu';
import Burger from '../../widgets/burger/burger.vue';
import PackageState from "../../modules/PackageState";

@Component({
    components: { TieredMenu, Burger },
})
class BackofficeLayout extends Vue {

    @Prop
    topBarHeight: number = 60;

    @Prop
    menuWidth: number = 180;

    @Prop
    menuWidthCollapsed: number = 50;

    WINDOW_WIDTH = window.innerWidth;
    COLLAPSE_BREAKPOINT = 900;
    MOBILE_BREAKPOINT = 768;

    @Prop
    menu?: any[]

    menuCollapsed = (window as any)['menuCollapsed'] ?? false;
    burgerOpen = false;

    created() {
        window.addEventListener('resize', () => {
            this.WINDOW_WIDTH = window.innerWidth;
        });
    }

    toggleMenu() {
        this.menuCollapsed = !this.menuCollapsed;
        (window as any)['menuCollapsed'] = this.menuCollapsed;
    }

    isCollapsed() {
        return (this.WINDOW_WIDTH < this.COLLAPSE_BREAKPOINT &&
            this.WINDOW_WIDTH > this.MOBILE_BREAKPOINT
        ) || this.menuCollapsed;
    }

    burgerChange(e: boolean) {
        if (e) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    getVersion() {
        return PackageState.get('version');
    }

}
export default toNative(BackofficeLayout);