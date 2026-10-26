<template>
    <div class="checkbox" :class="{active: value, disabled: isDisabled()}" @click="onclick()">
        <svg-icon :name="icon"/>
    </div>
</template>

<script lang="ts" src="./checkbox.ts"></script>
<style lang="scss" src="./checkbox.scss"></style>