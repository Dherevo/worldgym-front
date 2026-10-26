<template>
    <div class="editor-input-container" ref="container">
        <div class="quill-editor" 
            ref="editor" 
            v-if="!isReadonly()"
            v-bind="bindProps()"></div>

        <div v-else class="readonly-value" v-safe-html="modelValue" />
    </div>
</template>

<script lang="ts" src="./editor-input.ts"></script>
<style lang="scss" src="./editor-input.scss"></style>