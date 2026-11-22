<template>
    <button type="button" class="back-button" :class="{ labeled: !!label }" :aria-label="label || $t('common.back')">
        <svg-icon name="heroicons-outline/chevron-left" />
        <span v-if="label" class="bb-label">{{ label }}</span>
    </button>
</template>

<script lang="ts" src="./back-button.ts"></script>
<style lang="scss" src="./back-button.scss"></style>
