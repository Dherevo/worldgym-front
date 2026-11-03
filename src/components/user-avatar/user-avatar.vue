<template>
    <span class="user-avatar-img" :style="{ width: size + 'px', height: size + 'px', fontSize: size * 0.45 + 'px' }">
        <img v-if="url" :src="url" :alt="name" />
        <template v-else>{{ initial }}</template>
    </span>
</template>

<script lang="ts" src="./user-avatar.ts"></script>
<style lang="scss" src="./user-avatar.scss"></style>
