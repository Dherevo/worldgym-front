<template>
    <svg-icon class="back" name="prime/angle-left" :style="getStyle()" @click="doClick()"/>
</template>

<style scoped>
svg.back {
    color: black;
}
</style>

<script lang="ts" src="./back.ts"></script>