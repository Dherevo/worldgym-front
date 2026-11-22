import { Component, Vue, Prop, toNative } from "vue-facing-decorator";
import { Storage } from "lib";

type RowAction = 'share' | 'edit' | 'delete';

const HINT_KEY = 'swipeHintSeen';
// Only one row shows the peek per run, and only until the user has seen it once
let peeked = false;

// A list row with its actions behind it. With a finger (app, phone) the row slides to the left to show them (plain
// horizontal scroll with snap); with a mouse they are small icon buttons next to the row, always visible.
// A small handle (three dots) on the right opens and closes the actions with a tap, and the first time a row with
// actions appears on a touch screen it slides a little to show that it can be pulled. The row goes in the slot; the actions are events: share, edit, delete (the ones asked for in `actions`)
@Component({ emits: ['share', 'edit', 'delete'] })
class SwipeRow extends Vue {

    @Prop({ type: Array, default: () => ['edit', 'delete'] })
    actions!: RowAction[];

    // false: the row is shown alone (a list where only some rows have actions)
    @Prop({ type: Boolean, default: true })
    enabled!: boolean;

    has(action: RowAction): boolean {
        return this.actions.includes(action);
    }

    get el(): HTMLElement {
        return this.$refs.root as HTMLElement;
    }

    // Open (slide to the actions) or close
    toggle() {
        const el = this.el;
        el.scrollTo({ left: el.scrollLeft > 10 ? 0 : el.scrollWidth, behavior: 'smooth' });
    }

    mounted() {
        if (!this.enabled || peeked || !window.matchMedia('(hover: none)').matches) return;
        try { if (Storage.get(HINT_KEY)) return; } catch { /* without storage the peek is just shown */ }

        window.setTimeout(() => {
            const el = this.el;
            const r = el?.getBoundingClientRect();
            // Only a row that is on screen, once
            if (!el || peeked || !r || r.top < 0 || r.bottom > window.innerHeight || el.scrollWidth <= el.clientWidth) return;
            peeked = true;
            try { Storage.set(HINT_KEY, '1'); } catch { /* idem */ }

            el.style.scrollSnapType = 'none';
            el.scrollTo({ left: 64, behavior: 'smooth' });
            window.setTimeout(() => {
                el.scrollTo({ left: 0, behavior: 'smooth' });
                window.setTimeout(() => { el.style.scrollSnapType = ''; }, 500);
            }, 900);
        }, 900);
    }
}
export default toNative(SwipeRow);
