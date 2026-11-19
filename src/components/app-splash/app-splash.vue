<template>
    <Transition name="splash-fade">
        <div v-if="visible" class="app-splash" role="status" :aria-label="$t('splash.loading')">
            <div class="splash-logo">WORLD<span class="logo-accent">GYM</span></div>
            <p class="splash-welcome">{{ $t('splash.welcome') }}</p>
        </div>
    </Transition>
</template>

<script lang="ts" src="./app-splash.ts"></script>
<style lang="scss" src="./app-splash.scss"></style>
