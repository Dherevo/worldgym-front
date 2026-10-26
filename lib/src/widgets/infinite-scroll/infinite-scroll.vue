<template>
    <div class="infinite-scroll custom-scrollbar" @scroll="handleScroll($event)" ref="container"
    :style="{
        'display': reverse ? 'flex' : 'block',
        'flex-direction': reverse ? 'column-reverse' : ''
    }">
        <div class="list-container">
            <slot v-for="(item, index) in list" :item="item" :index="index"></slot>
        </div>
        <div class="empty-message" v-if="emptyMessage && list && list.length == 0" v-safe-html="emptyMessage"/>
        <loader v-if="!list || loading" />
        <div ref="mark"></div>
    </div>
</template>

<style lang="scss" src="./infinite-scroll.scss"></style>
<script lang="ts" src="./infinite-scroll.ts"></script>