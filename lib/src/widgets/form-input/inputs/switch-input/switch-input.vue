<template>
    <ToggleSwitch v-if="!isReadonly()" 
        :modelValue="modelValue" 
        @change="updateValue(!modelValue)" 
        v-bind="bindProps()"
        :inputId="name"
        :disabled="disabled"/>

    <BooleanIcon v-else
        :value="modelValue" />
</template>

<script lang="ts" src="./switch-input.ts"></script>
<style lang="scss" src="./switch-input.scss"></style>