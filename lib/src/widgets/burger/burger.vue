<template>
    <div class="burger" :class="{
        open: open && !shouldBeStatic()
    }" @click="toggle()">
        <div class="burger1" :style="{'background-color': getColor()}"/>
        <div class="burger2" :style="{'background-color': getColor()}"/>
        <div class="burger3" :style="{'background-color': getColor()}"/>
    </div>
</template>

<style lang="scss" src="./burger.scss"></style>
<script lang="ts" src="./burger.ts"></script>