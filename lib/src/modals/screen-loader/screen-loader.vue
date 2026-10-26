<template>
    <loader :color="color"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    props: ['color']
});
</script>

<style>
.fullscreen-loader-modal .p-dialog-header,
.fullscreen-loader-modal .p-dialog-content {
    background: transparent;
}
.fullscreen-loader-modal .p-dialog-content .loader {
    width: 120px;
    height: 120px;
    border-width: 12px;
    border-top-width: 15px;
    border-color: transparent;
}
</style>