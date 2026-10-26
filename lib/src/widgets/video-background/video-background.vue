<template>
    <div class="video-background" ref="container">
        <video-player ref="video" :src="src" :controls="false" autoplay muted loop
        :videoStyle="videoSize()"/>

        <slot />
    </div>
</template>

<script lang="ts" src="./video-background.ts"></script>
<style lang="scss" src="./video-background.scss"></style>