<template>
    <div class="video-player">
        <video ref="video" :controls="controls !== false" :muted="muted !== false"
        :style="videoStyle">
            <source :src="src" :type="type">
            Video player not supported
        </video>
    </div>
</template>

<script lang="ts" src="./video-player.ts" />
<style lang="scss" src="./video-player.scss" />