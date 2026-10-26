<template>
    <div class="popup" :class="{
        open: open,
        dropdown: dropdownStyle !== false
    }" ref="popup">
        <div class="popup-trigger" @click="() => {
            if (automatic) {
                togglePopup();
            }
        }">
            <slot name="button" :toggle="() => togglePopup()"/>
            <svg-icon 
            :name="icon ? icon : 'tabler/dots'" 
            v-if="!hasSlot('button')"
            style="transform:rotate(90deg);width:20px;height:20px"/>
        </div>

        <div class="popup-content" :style="animationCSS()"
        @click="clickOnContent($event)">
            <slot name="content" />
        </div>
    </div>
</template>

<script lang="ts" src="./popup.ts"></script>
<style lang="scss" src="./popup.scss"></style>