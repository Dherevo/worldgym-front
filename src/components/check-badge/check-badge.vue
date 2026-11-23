<template>
    <svg class="check-badge" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="10" class="cb-bg" />
        <path d="M5.6 10.4l3 3 5.8-6.2" class="cb-tick" />
    </svg>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// The "done" tick: a green disc with a white check that draws itself (transform, opacity and stroke only)
export default defineComponent({ name: 'CheckBadge' });
</script>

<style lang="scss">
.check-badge {
    flex: none; width: 1.05rem; height: 1.05rem; vertical-align: -0.15em; margin-left: 0.4rem;
    animation: cb-pop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.4) backwards;
    .cb-bg { fill: var(--kcal-ok, #16a34a); }
    .cb-tick {
        fill: none; stroke: #fff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;
        stroke-dasharray: 16; stroke-dashoffset: 0; animation: cb-draw 0.35s ease-out 0.12s backwards;
    }
}
@keyframes cb-pop { from { transform: scale(0.3); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes cb-draw { from { stroke-dashoffset: 16; } to { stroke-dashoffset: 0; } }
</style>
