<template>
    <Password ref="input"
    v-if="!isReadonly()"
    @keydown.enter="passEmit('pressEnter')"
    :modelValue="modelValue" 
    @input="updateValue($event.target.value)" 
    v-bind="bindProps()"
    :inputId="name"
    :disabled="isDisabled()">
        <template #footer v-if="instructions">
            <br>
            <div v-safe-html="instructions" />    
        </template>
    </Password>
    <div class="flex-row gap5" v-else>
        <div class="flex-grow">
            {{ showPassword ? modelValue : modelValue.replace(/./g, '*') }}
        </div>
        <svg-icon :name="showPassword ? 'prime/eye-slash' : 'prime/eye'" @click="showPassword = !showPassword"/>
    </div>
</template>

<script lang="ts" src="./password-input.ts"></script>