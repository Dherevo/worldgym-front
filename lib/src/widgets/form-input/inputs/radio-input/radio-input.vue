<template>
    <RadioButton v-if="!isReadonly()" 
        :modelValue="modelValue" 
        @change="updateValue($event)"
        :name="group"
        :value="value"
        v-bind="bindProps()" 
        :disabled="isDisabled()"/>
    
    <BooleanIcon v-else
        :value="modelValue" />
</template>

<script lang="ts" src="./radio-input.ts"></script>
<style lang="scss" src="./radio-input.scss"></style>