import { Component, Vue, toNative } from "vue-facing-decorator";

// Welcome screen with the logo, shown when the app or the web opens. It stays for a minimum time and until the
// first navigation is resolved (the session is restored there), so it does not give way to a screen that then changes.
const MIN_MS = 1100;

@Component({})
class AppSplash extends Vue {

    visible = true;

    mounted() {
        const minTime = new Promise(resolve => setTimeout(resolve, MIN_MS));
        // If the first navigation fails the splash goes away anyway
        const ready = this.$router.isReady().catch(() => undefined);
        Promise.all([minTime, ready]).then(() => { this.visible = false; });
    }
}
export default toNative(AppSplash);
