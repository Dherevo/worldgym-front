import { Component, Vue, Prop, Watch, toNative } from "vue-facing-decorator";
import { lottieUrl } from "@/modules/exerciseMedia";

// Animation of an exercise: its Lottie (the one of the user's gender, else the other) or, with none, its image/GIF.
// The classes and size attributes of the parent go to the root element, so it is used like the old <img>
const cache = new Map<string, Promise<any>>();

function loadJson(url: string): Promise<any> {
    if (!cache.has(url)) {
        const p = fetch(url).then(r => {
            if (!r.ok) throw new Error(String(r.status));
            return r.json();
        });
        p.catch(() => cache.delete(url));
        cache.set(url, p);
    }
    return cache.get(url)!;
}

@Component({})
class ExerciseAnimation extends Vue {

    @Prop({ type: Object, default: null })
    exercise!: any;

    failed = false;
    ratio = '';
    player: any = null;
    token = 0;

    get url(): string | null {
        return this.failed ? null : lottieUrl(this.exercise);
    }

    get gif(): string | null {
        return this.exercise?.gif_url || null;
    }

    @Watch('url', { immediate: false })
    onUrl() {
        this.start();
    }

    mounted() {
        this.start();
    }

    beforeUnmount() {
        this.destroy();
    }

    destroy() {
        this.token++;
        if (this.player) { this.player.destroy(); this.player = null; }
    }

    async start() {
        this.destroy();
        const url = this.url;
        if (!url) return;
        const mine = this.token;
        try {
            const [data, lottie] = await Promise.all([loadJson(url), import("lottie-web/build/player/lottie_light")]);
            await this.$nextTick();
            const box = this.$refs.box as HTMLElement | undefined;
            if (mine !== this.token || !box) return;
            this.ratio = `${data.w || 1} / ${data.h || 1}`;
            this.player = (lottie.default || lottie).loadAnimation({
                container: box, renderer: 'svg', loop: true, autoplay: true, animationData: JSON.parse(JSON.stringify(data))
            });
        } catch {
            if (mine === this.token) this.failed = true;   // falls back to the image
        }
    }
}
export default toNative(ExerciseAnimation);
