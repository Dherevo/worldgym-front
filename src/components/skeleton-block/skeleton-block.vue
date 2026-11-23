<template>
    <div class="skeleton-block" aria-hidden="true">
        <div v-for="i in rows" :key="i" class="sk-line" :style="{ height: height, width: i === rows && rows > 1 ? '60%' : '100%' }"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Grey placeholder shapes with a soft shimmer, shown while a screen loads (instead of a blank page or a "loading" text)
export default defineComponent({
    name: 'SkeletonBlock',
    props: {
        rows: { type: Number, default: 1 },
        height: { type: String, default: '1rem' },
    },
});
</script>

<style lang="scss">
.skeleton-block {
    display: flex; flex-direction: column; gap: 0.6rem;
    .sk-line {
        position: relative; overflow: hidden; border-radius: 8px; background: var(--surface-3, var(--surface-2));
        // The shimmer moves with transform only (cheap on any phone)
        &::after {
            content: ''; position: absolute; inset: 0; transform: translateX(-100%);
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
            animation: sk-shimmer 1.3s ease-in-out infinite;
        }
    }
}
@keyframes sk-shimmer { to { transform: translateX(100%); } }
</style>
