<template>
    <Transition name="ob-slide">
        <div v-if="text" class="offline-banner" :class="{ warn }" role="status">{{ text }}</div>
    </Transition>
</template>

<script lang="ts" src="./offline-banner.ts"></script>
<style lang="scss" src="./offline-banner.scss"></style>
