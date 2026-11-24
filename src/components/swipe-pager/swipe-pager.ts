import { Component, Vue, Prop, Watch, toNative } from "vue-facing-decorator";
import { belongsToSomethingElse } from "@/modules/swipeGuard";

const BOTTOM_BAR = 64;          // px kept free for the bottom tab bar when the pager fills the screen
const LOCK_DISTANCE = 8;        // px before deciding if the gesture is horizontal or vertical
const COMMIT_FRACTION = 0.25;   // of the width: enough to turn the page
const COMMIT_SPEED = 0.5;       // px/ms: a quick flick turns the page too
const EDGE_RESISTANCE = 0.3;    // dragging past the first/last page

interface Touch1 { x: number; y: number; t: number; lock: '' | 'h' | 'v' }

// Pages side by side: the finger drags the current page and the neighbour shows up beside it (like a book).
// The parent renders the content of each page with the slot (index) and changes `index` when a page is turned.
// Only active when `enabled` (the app); otherwise it is just a wrapper around the current page.
// Methods are called through lambdas: arrow properties of the class would not see the component (`this`).
@Component({ emits: ['change', 'neighbors'] })
class SwipePager extends Vue {

    @Prop({ type: Number, required: true })
    index!: number;

    @Prop({ type: Number, required: true })
    count!: number;

    @Prop({ type: Boolean, default: false })
    enabled!: boolean;

    cur = 0;                    // page shown (set at once on commit; the parent follows with `index`)
    neighborsOn = false;        // neighbours are only mounted while dragging
    offset = 0;
    fill = 0;                   // min-height so the pager reaches the bottom of the screen (short pages)
    dragging = false;
    animating = false;

    get shown(): number[] {
        if (!this.enabled || !this.neighborsOn) return [this.cur];
        return [this.cur - 1, this.cur, this.cur + 1].filter(i => i >= 0 && i < this.count);
    }

    // Transform only while moving: at rest it would trap position:fixed modals inside the pages
    get trackStyle() {
        return this.dragging || this.animating ? { transform: `translate3d(${this.offset}px, 0, 0)`, willChange: 'transform' } : undefined;
    }

    @Watch('index')
    onIndex(i: number) {
        this.cur = i;
        this.$nextTick(() => this.fillScreen());
    }

    // A short page would only take swipes over its own content: stretch the pager down to the bottom bar
    fillScreen() {
        const root = this.$refs.root as HTMLElement | undefined;
        if (!this.enabled || !root) return;
        const top = root.getBoundingClientRect().top + window.scrollY;
        this.fill = Math.max(0, Math.round(window.innerHeight - top - BOTTOM_BAR));
    }

    created() {
        this.cur = this.index;   // props are not available while the fields are initialised
    }

    mounted() {
        const root = this.$refs.root as HTMLElement;
        this.fillScreen();
        // The page above (header, tabs) may finish rendering after this component
        setTimeout(() => this.fillScreen(), 400);
        window.addEventListener('resize', handlers.resize);
        handlers.start = (e: TouchEvent) => this.onStart(e);
        handlers.move = (e: TouchEvent) => this.onMove(e);
        handlers.end = (e: TouchEvent) => this.onEnd(e);
        handlers.cancel = () => this.onCancel();
        handlers.resize = () => this.fillScreen();
        root.addEventListener('touchstart', handlers.start, { passive: true });
        root.addEventListener('touchmove', handlers.move, { passive: true });
        root.addEventListener('touchend', handlers.end, { passive: true });
        root.addEventListener('touchcancel', handlers.cancel, { passive: true });
    }

    beforeUnmount() {
        const root = this.$refs.root as HTMLElement | undefined;
        if (root) {
            root.removeEventListener('touchstart', handlers.start);
            root.removeEventListener('touchmove', handlers.move);
            root.removeEventListener('touchend', handlers.end);
            root.removeEventListener('touchcancel', handlers.cancel);
        }
        window.removeEventListener('resize', handlers.resize);
        window.clearTimeout(state.fallback);
    }

    get width(): number {
        return (this.$refs.root as HTMLElement).clientWidth || window.innerWidth;
    }

    hasPage(delta: number): boolean {
        const i = this.cur + delta;
        return i >= 0 && i < this.count;
    }

    onStart(e: TouchEvent) {
        state.touch = null;
        if (!this.enabled || this.animating || e.touches.length !== 1 || belongsToSomethingElse(e.target)) return;
        state.touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), lock: '' };
    }

    onMove(e: TouchEvent) {
        const t = state.touch;
        if (!t || t.lock === 'v') return;
        const dx = e.touches[0].clientX - t.x;
        const dy = e.touches[0].clientY - t.y;

        if (!t.lock) {
            if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return;
            if (Math.abs(dx) <= Math.abs(dy)) { t.lock = 'v'; return; }
            t.lock = 'h';
            this.neighborsOn = true;
            this.dragging = true;
            this.$nextTick(() => this.$emit('neighbors'));
        }
        // Past the first or last page the page resists
        this.offset = this.hasPage(dx < 0 ? 1 : -1) ? dx : dx * EDGE_RESISTANCE;
    }

    onEnd(e: TouchEvent) {
        const t = state.touch;
        state.touch = null;
        if (!t || t.lock !== 'h' || !e.changedTouches.length) { this.cancelDrag(); return; }

        const dx = e.changedTouches[0].clientX - t.x;
        const speed = Math.abs(dx) / Math.max(1, Date.now() - t.t);
        const delta = dx < 0 ? 1 : -1;
        const commit = this.hasPage(delta) && (Math.abs(dx) > this.width * COMMIT_FRACTION || speed > COMMIT_SPEED);
        this.settle(commit ? delta : 0);
    }

    onCancel() {
        state.touch = null;
        this.cancelDrag();
    }

    cancelDrag() {
        if (this.dragging) this.settle(0);
    }

    // Slides the track to the chosen page (delta +1/-1) or back to the current one (0)
    settle(delta: number) {
        state.target = delta;
        this.dragging = false;
        this.animating = true;
        this.offset = -delta * this.width;
        // transitionend does not fire when nothing moved
        window.clearTimeout(state.fallback);
        state.fallback = window.setTimeout(() => this.finish(), 450);
    }

    onTransitionEnd(e: TransitionEvent) {
        if (e.target === this.$refs.track && this.animating) this.finish();
    }

    finish() {
        window.clearTimeout(state.fallback);
        if (!this.animating) return;
        const delta = state.target;
        this.animating = false;
        this.offset = 0;
        if (delta !== 0) {
            this.cur += delta;
            this.$emit('change', this.cur);
        }
        // Drop the neighbours once the new current page is in place
        this.$nextTick(() => { this.neighborsOn = false; });
    }
}

// Gesture state kept out of Vue's reactivity (one pager per screen)
const state: { touch: Touch1 | null; target: number; fallback: number | undefined } = { touch: null, target: 0, fallback: undefined };
const handlers: Record<'start' | 'move' | 'end' | 'cancel' | 'resize', (e: any) => void> = {
    start: () => undefined, move: () => undefined, end: () => undefined, cancel: () => undefined, resize: () => undefined,
};

export default toNative(SwipePager);
