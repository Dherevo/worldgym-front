<template>
    <SvgIcon 
    class="boolean-icon"
    :class="{
        true: value,
        false: !value
    }"
    :name="value ? 'prime/check' : 'prime/times'"/>
</template>

<script lang="ts" src="./boolean-icon.ts"></script>
<style lang="scss" src="./boolean-icon.scss"></style>