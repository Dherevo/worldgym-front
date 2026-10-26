<template>
    <div class="circle-image" :style="imageStyle()"></div>
</template>
<style>
.circle-image {
    border-radius: 50%;
    background-color: gray;
    background-position: center;
    background-size: cover;
    min-width: 20px;
    min-height: 20px;
    aspect-ratio: 1;
}
</style>
<script lang="ts" src="./circle-image.ts"></script>