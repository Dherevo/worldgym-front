<template>
    <FilePicker v-if="['media', 'image', 'video'].includes(type ?? '')" 
        :accept="mediaAccept()"
        :disabled="disabled"
        v-bind="bindProps()" 
        @change="imagePicked">
            <div class="image-box-picker bgimage" :style="{
                'background-image': (mediaSrc && mediaType == 'image') ? 'url(' + mediaSrc + ')' : ''
            }" :class="{filled: mediaSrc}">

                <div v-if="!mediaSrc" class="image-box-picker-label">
                    <svg-icon name="prime/camera"/>
                    <div v-safe-html="label ? label : mediaPickerLabel()"/>
                </div>

                <video-player v-if="mediaSrc && mediaType == 'video'" :src="mediaSrc"/>

                <div v-if="canDelete && mediaSrc" class="delete-btn" @click.stop="removeFile()">
                    <svg-icon name="prime/times" />
                </div>

            </div>
    </FilePicker>
</template>

<script lang="ts" src="./file-input.ts"></script>
<style lang="scss" src="./file-input.scss"></style>