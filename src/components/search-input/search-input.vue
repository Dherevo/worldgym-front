<template>
    <div class="sx-search" :class="{ filled: !!modelValue }">
        <svg-icon class="si-icon" name="heroicons-outline/magnifying-glass" />
        <input ref="field" type="search" enterkeyhint="search" autocomplete="off" :value="modelValue" :placeholder="placeholder" :autofocus="autofocus" @input="onInput" />
        <button v-if="modelValue" type="button" class="si-clear" :aria-label="$t('common.clear')" @click="clear()">
            <svg-icon name="heroicons-outline/x-mark" />
        </button>
    </div>
</template>

<script lang="ts" src="./search-input.ts"></script>
<style lang="scss" src="./search-input.scss"></style>
