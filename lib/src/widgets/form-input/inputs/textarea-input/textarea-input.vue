<template>
    <template v-if="!isReadonly()" >
    <Textarea ref="input"
        :modelValue="modelValue"
        :id="name"
        @input="updateValue($event.target.value)" 
        v-bind="bindProps()" 
        :disabled="disabled"
        :placeholder="placeholder"
        @keydown.enter="passEmit('pressEnter')"
        @keydown.tab="passEmit('tabPressed')"
        @keyup="passEmit('keyup', $event)"/>

        <div class="max-length" :class="{
            overpassed: (modelValue ?? '').length > max
        }" v-if="max">{{ (modelValue ?? '').length + ' / ' + max }}</div>
    </template>

    <div v-else class="readonly-value" v-safe-html="modelValue"/>
</template>

<script lang="ts" src="./textarea-input.ts"></script>
<style lang="scss" src="./textarea-input.scss"></style>