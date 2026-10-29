<template>
    <nav class="tab-bar" role="tablist">
        <a v-for="t in tabs" :key="t.path" class="tab-bar-item" role="tab" :href="t.path"
            :class="{ active: isActive(t.path) }" :aria-selected="isActive(t.path)" @click.prevent="to(t.path)">
            {{ $t(t.label) }}
        </a>
    </nav>
</template>

<script lang="ts" src="./tab-bar.ts"></script>
<style lang="scss" src="./tab-bar.scss"></style>
