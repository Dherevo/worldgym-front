<template>
    <div v-if="url" ref="box" class="ex-lottie" :style="{ aspectRatio: ratio || undefined }"></div>
    <img v-else-if="gif" :src="gif" :alt="exercise.name" />
</template>

<script lang="ts" src="./exercise-animation.ts"></script>
<style lang="scss" src="./exercise-animation.scss"></style>
