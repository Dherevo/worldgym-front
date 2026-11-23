import type { Directive } from "vue";
import { reducedMotion } from "@/modules/motion";

// v-grow="percent": a bar that fills from empty when it appears and glides when its value changes.
// (The CSS of the bar has the `transition: width`.) Replaces :style="{ width: value + '%' }".
const grow: Directive<HTMLElement, number> = {
    mounted(el, binding) {
        const target = `${Math.max(0, Number(binding.value) || 0)}%`;
        if (reducedMotion()) {
            el.style.width = target;
            return;
        }
        el.style.width = '0%';
        // Two frames: the browser must paint the empty bar first, or there is nothing to animate from
        requestAnimationFrame(() => requestAnimationFrame(() => { el.style.width = target; }));
    },
    updated(el, binding) {
        el.style.width = `${Math.max(0, Number(binding.value) || 0)}%`;
    },
};

export default grow;
