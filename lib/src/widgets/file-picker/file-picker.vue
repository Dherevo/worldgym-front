<template>
    <div class="file-picker" 
    @drop="dropped" 
    @dragenter.prevent 
    @dragover.prevent 
    @click="triggerInput"
    :style="{cursor: clickable ? 'pointer' : 'default'}"
    :class="{disabled: isDisabled()}">
        <slot />
        <input type="file" v-if="clickable" @change.stop="fileSelected" style="display:none" ref="inputFile"
        :multiple="multiple" :accept="accept">
    </div>
</template>

<script lang="ts" src="./file-picker.ts"></script>