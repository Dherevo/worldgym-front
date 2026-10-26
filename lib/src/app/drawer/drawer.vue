<template>
    <Drawer v-model:visible="visible" :position="position" class="app-drawer" :class="{
        'no-closex': !closex,
        'no-header': !title && !closex
    }" :dismissable="cancelable">

        <template #header v-if="title">
            <div v-safe-html="title" />
        </template>

        <div class="app-drawer-content">
            <component v-if="component" :is="component" v-bind="$utils.isFunction(componentProps) ? componentProps() : componentProps"/>
        </div>

        <div class="app-drawer-buttons" v-if="buttons.length > 0">
            <btn v-for="(btn, index) in buttons" :key="index" @click="btn.onClick()"
            :disabled="btn.disabled" :loading="btn.loading" :class="btn.class" :style="btn.style">
                <svg-icon v-if="btn.icon && btn.iconPosition != 'right'" :name="btn.icon" />
                <div>{{ btn.content }}</div>
                <svg-icon v-if="btn.icon && btn.iconPosition == 'right'" :name="btn.icon" />
            </btn>
        </div>
    </Drawer>
</template>

<script lang="ts" src="./drawer.ts"></script>
<style lang="scss" src="./drawer.scss"></style>