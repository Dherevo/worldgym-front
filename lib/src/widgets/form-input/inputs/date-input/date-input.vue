<template>
    <DatePicker v-if="!isReadonly()" 
        :modelValue="dateValue" 
        @update:modelValue="updateValue($event)" 
        v-bind="bindProps()"
        :disabled="isDisabled()"
        panelClass="form-input-calendar"
        :minDate="minDate"
        :maxDate="maxDate"/>

    <div v-else class="readonly-value" v-safe-html="readonlyText()"/>
</template>

<script lang="ts" src="./date-input.ts"></script>
<style lang="scss" src="./date-input.scss"></style>