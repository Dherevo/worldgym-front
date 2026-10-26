<template>
    <div class="phone-input-container" ref="container"
        :class="{
            readonly: isReadonly()
        }">
        <input
        class="phone-input" 
        maxlength="15" 
        ref="input" >
    </div>
</template>

<script lang="ts" src="./phone-input.ts"></script>
<style lang="scss" src="./phone-input.scss"></style>