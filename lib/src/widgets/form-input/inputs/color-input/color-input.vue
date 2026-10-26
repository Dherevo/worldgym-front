<template>
    <ColorPicker v-if="!isReadonly()" 
        :modelValue="modelValue" 
        @update:modelValue="updateValue($event)"
        :inputId="name"
        :disabled="isDisabled()"/>

    <div v-else
    class="readonly-value flex-row gap5">
        <span :style="{
            width: '20px',
            height: '20px',
            'background-color': '#'+modelValue,
            'border-radius': '3px'
        }"/>
        <span>#{{ modelValue }}</span>
    </div>
</template>

<script lang="ts" src="./color-input.ts"></script>