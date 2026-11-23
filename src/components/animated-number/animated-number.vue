<template>
    <span class="animated-number">{{ text }}</span>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { tween } from "@/modules/motion";

// A number that counts up (or down) to its value when it appears and when it changes
export default defineComponent({
    name: 'AnimatedNumber',
    props: {
        value: { type: Number, default: 0 },
        decimals: { type: Number, default: 0 },
        duration: { type: Number, default: 600 },
    },
    data() {
        return { shown: 0, stop: null as null | (() => void) };
    },
    computed: {
        text(): string {
            return this.shown.toFixed(this.decimals);
        },
    },
    watch: {
        value(to: number) {
            this.run(this.shown, to);
        },
    },
    mounted() {
        this.run(0, this.value);
    },
    beforeUnmount() {
        this.stop?.();
    },
    methods: {
        run(from: number, to: number) {
            this.stop?.();
            this.stop = tween(from, Number(to) || 0, this.duration, v => { this.shown = v; });
        },
    },
});
</script>

<style lang="scss">
.animated-number { font-variant-numeric: tabular-nums; }
</style>
